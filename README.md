# VORTEX AI GRID / Autonomous AI Store

This project is an end-to-end, production-ready Autonomous AI Store built on Google Cloud and Firebase. It autonomously discovers trending products, enriches them with AI-generated content, and publishes them to an e-commerce platform.

## Core Features

-   **Autonomous Discovery**: A Cloud Run scraper using Playwright discovers trending products from various web sources.
-   **Data Ingestion**: Raw HTML and images are stored in Firebase Storage (GCS) for provenance and processing.
-   **Structured Normalization**: Product data is parsed and stored in a structured format in Firestore.
-   **AI Enrichment**: OpenAI is used to generate SEO-friendly titles, descriptions, and social media content.
-   **E-commerce Integration**: Approved products are automatically published to Shopify.
-   **Social Automation**: AI-generated content is posted to social media channels like X (Twitter).
-   **Admin Console**: A web-based UI (built with Next.js) for reviewing, approving, and managing the entire pipeline.

## Architecture

The system is composed of several key components:

1.  **Cloud Run Scraper**: A Python service responsible for the heavy lifting of web scraping. Triggered by Cloud Scheduler.
2.  **Firebase Cloud Functions**: Handle event-driven tasks like AI enrichment (on new product creation) and publishing to Shopify (on product approval).
3.  **Firestore**: The central database for all structured data, including products, users, and schedules.
4.  **Firebase Storage**: Used for storing raw scraped data (private) and public-facing product images (public).
5.  **Next.js Frontend**: Provides the admin UI and has the potential to be the public-facing storefront.
6.  **Google Secret Manager**: Securely stores all API keys and sensitive credentials.
7.  **Cloud Scheduler**: Orchestrates the entire system by triggering the discovery jobs on a defined schedule.

## Local Development

### Prerequisites

-   Node.js (v18+) and npm
-   Python (v3.11+) and pip
-   Google Cloud SDK (`gcloud`)
-   Firebase CLI (`firebase-tools`)
-   Docker

### 1. Setup Environment

First, copy the example environment file:

```bash
cp .env.example .env
```

Fill in the required values in the `.env` file. For local development against emulators, most API keys are not strictly needed unless you are testing live external services.

### 2. Install Dependencies

```bash
# For Cloud Functions & Frontend
npm install

# For Cloud Run Scraper
pip install -r cloudrun/requirements.txt
python -m playwright install --with-deps
```

### 3. Run Emulators

To simulate the Firebase environment locally, start the emulators:

```bash
firebase emulators:start
```

This will start emulators for Firestore, Storage, Auth, and Functions.

### 4. Run the Scraper Locally (Test Mode)

You can test the scraper against a single URL to verify parsing logic. Set your service account credentials and run:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="path/to/your-gcp-service-account.json"
python cloudrun/scraper_cloudrun.py --test-url "https://www.aliexpress.com/item/..." --dry-run
```

-   `--test-url`: The product page to scrape.
-   `--dry-run`: Prevents writing any data to the emulators/cloud, simply prints the parsed data.

To run against the local Firestore emulator, unset the `--dry-run` flag.

## Deployment

Deployment is a multi-step process involving Firebase services and Google Cloud Run.

See the `.github/workflows/ci-cd.yml` file for an automated approach.

### Manual Deployment Steps

1.  **Deploy Firebase Assets**:
    ```bash
    firebase deploy --only firestore:rules,functions,storage
    ```

2.  **Build and Push Cloud Run Image**:
    ```bash
    gcloud auth configure-docker
    docker build -t gcr.io/$GOOGLE_CLOUD_PROJECT/ai-store-scraper:latest ./cloudrun
    docker push gcr.io/$GOOGLE_CLOUD_PROJECT/ai-store-scraper:latest
    ```

3.  **Deploy Cloud Run Service**:
    You will need a service account (`SCRAPER_SA`) with the appropriate IAM roles.
    ```bash
    gcloud run deploy ai-store-scraper \
      --image gcr.io/$GOOGLE_CLOUD_PROJECT/ai-store-scraper:latest \
      --platform managed \
      --region us-central1 \
      --service-account SCRAPER_SA@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com \
      --set-env-vars "RAW_BUCKET=$RAW_BUCKET,IMAGE_BUCKET=$IMAGE_BUCKET" \
      --allow-unauthenticated
    ```

4.  **Schedule the Scraper**:
    Create a Cloud Scheduler job to trigger the Cloud Run service via an HTTP POST request.

---
*Bismillah. O Allah, grant barakah to this work, keep it lawful, and make it beneficial.*
