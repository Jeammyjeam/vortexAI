/**
 * VORTEX AI GRID - Cloud Functions
 *
 * This file contains the core backend logic that responds to events in Firestore.
 * 1. onProductCreate: Triggers AI enrichment when a new product is scraped.
 * 2. onProductApprove: Publishes an approved product to Shopify.
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const { SecretManagerServiceClient } = require("@google-cloud/secret-manager");
const { OpenAI } = require("openai");

admin.initializeApp();
const db = admin.firestore();
const secretManager = new SecretManagerServiceClient();

/**
 * Access a secret from Google Secret Manager.
 * @param {string} secretName The name of the secret to access.
 * @returns {Promise<string>} The secret value.
 */
async function accessSecret(secretName) {
  const [version] = await secretManager.accessSecretVersion({
    name: `projects/${process.env.GCLOUD_PROJECT}/secrets/${secretName}/versions/latest`,
  });
  return version.payload.data.toString();
}

/**
 * ---- ENRICHMENT FUNCTION ----
 * Triggered when a new product document is created in Firestore.
 * Fetches the product data, calls OpenAI for enrichment, and updates the doc.
 */
exports.onProductCreate = functions.firestore
  .document("products/{productId}")
  .onCreate(async (snap, context) => {
    const product = snap.data();
    const { productId } = context.params;
    console.log(`[Enrichment] Starting for product: ${productId}`);

    try {
      // 1. Get OpenAI API Key from Secret Manager
      const openaiApiKey = await accessSecret("OPENAI_API_KEY");
      const openai = new OpenAI({ apiKey: openaiApiKey });

      // 2. Define the AI prompt for enrichment and Halal classification
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

      // 3. Call OpenAI
      const response = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content);

      // 4. Determine new status and prepare update payload
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
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      };
      
      if (newStatus === 'rejected') {
        updatePayload.rejection_reason = result.halal_reasoning;
      }

      // 5. Update Firestore
      await db.collection("products").doc(productId).update(updatePayload);
      console.log(`[Enrichment] Success for product ${productId}. Status: ${newStatus}`);

    } catch (error) {
      console.error(`[Enrichment] Failed for product ${productId}:`, error);
      // Update status to 'failed_enrichment'
      await db.collection("products").doc(productId).update({
          listing_status: "failed_enrichment",
          error_message: error.message || "An unknown error occurred during enrichment.",
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  });


/**
 * ---- SHOPIFY PUBLISH FUNCTION ----
 * Triggered when a product's listing_status is updated to 'approved'.
 * Creates the product in Shopify via the Admin API.
 */
exports.onProductApprove = functions.firestore
  .document("products/{productId}")
  .onUpdate(async (change, context) => {
    const newValue = change.after.data();
    const previousValue = change.before.data();
    const { productId } = context.params;

    // Check if the status was just changed to 'approved'
    if (newValue.listing_status !== "approved" || previousValue.listing_status === "approved") {
      return null;
    }
    
    // Idempotency check: if it already has a shopify ID, do nothing.
    if (newValue.shopify_product_id) {
        console.log(`[Shopify] Product ${productId} already has a Shopify ID. Skipping.`);
        return null;
    }

    console.log(`[Shopify] Starting publish for product: ${productId}`);

    try {
        // 1. Get Shopify credentials from Secret Manager
        const shopifyToken = await accessSecret("SHOPIFY_ADMIN_ACCESS_TOKEN");
        const shopifyStoreUrl = await accessSecret("SHOPIFY_STORE_URL");
        const apiVersion = "2024-04";

        // 2. Prepare Shopify product payload
        const shopifyProduct = {
            product: {
                title: newValue.enriched_fields.seo_title || newValue.title,
                body_html: newValue.enriched_fields.seo_description || newValue.description,
                vendor: newValue.source_domain,
                status: "draft", // Create as draft first for final review in Shopify
                images: newValue.images.map(url => ({ src: url.replace("gs://", "https://storage.googleapis.com/") }))
            }
        };

        // 3. Call Shopify Admin API
        const response = await axios.post(
            `${shopifyStoreUrl}/admin/api/${apiVersion}/products.json`,
            shopifyProduct,
            {
                headers: {
                    "X-Shopify-Access-Token": shopifyToken,
                    "Content-Type": "application/json",
                },
            }
        );

        const createdProduct = response.data.product;

        // 4. Update Firestore with Shopify ID and new status
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
            error_message: errorMessage || "An unknown error occurred during Shopify publish.",
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
  });

    