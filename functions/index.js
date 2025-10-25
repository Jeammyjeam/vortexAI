
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const { OpenAI } = require("openai");

admin.initializeApp();
const db = admin.firestore();
const secretManager = new functions.secret.SecretManagerServiceClient();

let openai;

const setupOpenAI = async () => {
    try {
        const [version] = await secretManager.accessSecretVersion({
            name: `projects/${process.env.GCLOUD_PROJECT}/secrets/OPENAI_API_KEY/versions/latest`,
        });
        const openaiApiKey = version.payload.data.toString();
        openai = new OpenAI({ apiKey: openaiApiKey });
        console.log("Successfully configured OpenAI client.");
    } catch (error) {
        console.error("Could not access OpenAI API Key secret. Enrichment will be disabled.", error);
        openai = null;
    }
};

setupOpenAI();

exports.onProductCreate = functions.firestore
  .document("products/{productId}")
  .onCreate(async (snap, context) => {
    if (!openai) {
      console.log("OpenAI client not available, skipping enrichment.");
      return null;
    }
    
    const product = snap.data();
    const { productId } = context.params;
    console.log(`[Enrichment] Starting for product: ${productId}`);

    try {
      const prompt = `
        You are an expert e-commerce copywriter and a specialist in Islamic compliance.
        Analyze the following product data:
        Title: ${product.title}
        Description: ${product.description}
        Category: ${product.category_name || "general"}

        Tasks:
        1.  **Halal Classification**: Determine if the product is 'compliant', 'non-compliant' (e.g., alcohol, pork, gambling, inappropriate imagery), or 'indeterminate'. Provide a brief reasoning.
        2.  **SEO Title**: Write a new, catchy, and SEO-friendly title (max 60 chars).
        3.  **SEO Description**: Write a compelling meta description (max 160 chars).
        4.  **Social Caption**: Write an engaging caption for X/Twitter. Include relevant hashtags.

        Return a single, minified JSON object with the keys: "halal_status", "halal_reasoning", "seo_title", "seo_description", "social_caption".
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content);

      const isCompliant = result.halal_status === "compliant";
      const newStatus = isCompliant ? "enriched" : "rejected";

      const updatePayload = {
        listing_status: newStatus,
        enriched_at: admin.firestore.FieldValue.serverTimestamp(),
        enriched_fields: {
          seo_title: result.seo_title,
          seo_description: result.seo_description,
          social_captions: {
            twitter: result.social_caption,
          },
        },
        halal_status: result.halal_status,
        halal_reasoning: result.halal_reasoning,
        rejection_reason: isCompliant ? null : result.halal_reasoning,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      };

      await db.collection("products").doc(productId).update(updatePayload);
      console.log(`[Enrichment] Success for product ${productId}. Status: ${newStatus}`);

    } catch (error) {
      console.error(`[Enrichment] Failed for product ${productId}:`, error);
      await db.collection("products").doc(productId).update({
          listing_status: "failed_enrichment",
          error_message: error.message || "An unknown error occurred during enrichment.",
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  });


exports.onProductApprove = functions.firestore
  .document("products/{productId}")
  .onUpdate(async (change, context) => {
    const newValue = change.after.data();
    const previousValue = change.before.data();
    const { productId } = context.params;

    if (newValue.listing_status !== "approved" || previousValue.listing_status === "approved") {
      return null;
    }
    
    if (newValue.shopify_product_id) {
        console.log(`[Shopify] Product ${productId} already has a Shopify ID. Skipping.`);
        return null;
    }

    console.log(`[Shopify] Starting publish for product: ${productId}`);

    try {
        const [tokenVersion] = await secretManager.accessSecretVersion({
            name: `projects/${process.env.GCLOUD_PROJECT}/secrets/SHOPIFY_ADMIN_ACCESS_TOKEN/versions/latest`,
        });
        const shopifyToken = tokenVersion.payload.data.toString();

        const [urlVersion] = await secretManager.accessSecretVersion({
            name: `projects/${process.env.GCLOUD_PROJECT}/secrets/SHOPIFY_STORE_URL/versions/latest`,
        });
        const shopifyStoreUrl = urlVersion.payload.data.toString();

        const shopifyProduct = {
            product: {
                title: newValue.enriched_fields.seo_title || newValue.title,
                body_html: newValue.enriched_fields.seo_description || newValue.description,
                vendor: newValue.source_domain,
                status: "draft",
                images: newValue.images.map(url => ({ src: url.replace("gs://", "https://storage.googleapis.com/") }))
            }
        };

        const response = await axios.post(
            `${shopifyStoreUrl}/admin/api/2024-04/products.json`,
            shopifyProduct,
            {
                headers: {
                    "X-Shopify-Access-Token": shopifyToken,
                    "Content-Type": "application/json",
                },
            }
        );

        const createdProduct = response.data.product;

        await db.collection("products").doc(productId).update({
            listing_status: "published",
            shopify_product_id: createdProduct.id.toString(),
            published_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        console.log(`[Shopify] Successfully published product ${productId} to Shopify with ID: ${createdProduct.id}`);

    } catch (error) {
        const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error(`[Shopify] Failed to publish product ${productId}:`, errorMessage);
        await db.collection("products").doc(productId).update({
            listing_status: "failed_publish",
            error_message: errorMessage,
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
  });
