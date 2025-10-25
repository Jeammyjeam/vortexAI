
import os
import time
import random
from urllib.parse import urlparse, urljoin
import uuid

from playwright.sync_api import sync_playwright
from google.cloud import firestore, storage
from dotenv import load_dotenv

import parse_utils

# Load environment variables from .env file for local development
load_dotenv()

# --- Configuration ---
# GCP Configuration
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT")
RAW_BUCKET_NAME = os.getenv("RAW_BUCKET")
IMAGE_BUCKET_NAME = os.getenv("IMAGE_BUCKET")

# Scraper Configuration
SCRAPER_USER_AGENT = os.getenv("SCRAPER_USER_AGENT", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36")
SCRAPER_TIMEOUT = int(os.getenv("SCRAPER_TIMEOUT", 60)) * 1000  # in milliseconds

# --- Seed URLs for product discovery ---
# This is now a structured list to handle different discovery strategies.
SEED_SOURCES = [
    {
        "name": "AliExpress - Computer & Office",
        "url": "https://www.aliexpress.com/category/100003109/computer-office.html",
        "type": "ecommerce_category",
        "link_selector": 'a[href*="/item/"]',
    },
    {
        "name": "Amazon - Bestsellers in Kitchen",
        "url": "https://www.amazon.com/bestsellers/kitchen/ref=pd_zg_ts_kitchen",
        "type": "ecommerce_category",
        "link_selector": 'a[href*="/dp/"]',
    },
    {
        "name": "Reddit - r/shutupandtakemymoney",
        "url": "https://www.reddit.com/r/shutupandtakemymoney/top/?t=week",
        "type": "reddit_subreddit",
        "link_selector": 'a[data-testid="outbound-link"]',
    },
]


# --- Initialize Google Cloud Clients ---
try:
    db = firestore.Client(project=FIREBASE_PROJECT_ID)
    storage_client = storage.Client(project=FIREBASE_PROJECT_ID)
except Exception as e:
    print(f"FATAL: Could not initialize Google Cloud clients: {e}")
    exit(1)


def save_raw_html_to_gcs(html_content, url):
    """Saves the raw HTML content to a GCS bucket."""
    if not RAW_BUCKET_NAME:
        print("Warning: RAW_BUCKET environment variable not set. Skipping GCS save.")
        return None
    try:
        bucket = storage_client.bucket(RAW_BUCKET_NAME)
        filename = f"{time.strftime('%Y%m%d-%H%M%S')}_{parse_utils.generate_safe_filename(url)}.html"
        blob = bucket.blob(filename)
        blob.upload_from_string(html_content, content_type='text/html')
        print(f"Successfully saved raw HTML for {url} to {blob.name}")
        return f"gs://{RAW_BUCKET_NAME}/{blob.name}"
    except Exception as e:
        print(f"Error saving HTML to GCS for {url}: {e}")
        return None

def process_product_page(page, url):
    """Fetches, parses, and stores data for a single product URL."""
    print(f"Processing product page: {url}")
    try:
        page.goto(url, wait_until='networkidle', timeout=SCRAPER_TIMEOUT)
        html_content = page.content()

        # 1. Save raw HTML for provenance
        provenance_key = save_raw_html_to_gcs(html_content, url)
        if not provenance_key:
            print(f"Skipping product due to failure in saving raw HTML: {url}")
            return

        # 2. Parse structured data
        parsed_data = parse_utils.parse_generic(html_content, url)
        if not parsed_data.get('title') or not parsed_data.get('price'):
            print(f"Could not parse required fields (title, price) for {url}. Skipping.")
            return

        # 3. Process and upload images
        image_gcs_uris = []
        image_hashes = []
        for img_url in parsed_data.get('images', []):
            gcs_uri, img_hash = parse_utils.download_image_and_hash(img_url, storage_client, IMAGE_BUCKET_NAME)
            if gcs_uri and img_hash:
                image_gcs_uris.append(gcs_uri)
                image_hashes.append(img_hash)
        
        # 3.5. If a category was found, ensure it exists in the 'categories' collection
        if parsed_data.get('category_name') and parsed_data.get('category_slug'):
            category_slug = parsed_data['category_slug']
            category_doc_ref = db.collection('categories').document(category_slug)
            category_doc = category_doc_ref.get()
            if not category_doc.exists:
                category_doc_ref.set({
                    'name': parsed_data['category_name'],
                    'slug': category_slug,
                    'product_count': 1,
                    'created_at': firestore.SERVER_TIMESTAMP,
                })
            else:
                category_doc_ref.update({'product_count': firestore.Increment(1)})


        # 4. Assemble Firestore document
        product_id = str(uuid.uuid4())
        source_domain = urlparse(url).netloc
        
        trust_score = random.uniform(0.6, 0.95) # Placeholder
        trend_score = random.uniform(0.5, 0.98) # Placeholder

        product_doc = {
            "source_domain": source_domain,
            "source_url": url,
            "source_product_id": parse_utils.generate_safe_filename(url),
            "title": parsed_data['title'],
            "normalized_title": parsed_data['title'].lower(),
            "description": parsed_data['description'],
            "price": parsed_data['price'],
            "currency": parsed_data['currency'],
            "images": image_gcs_uris,
            "image_hashes": image_hashes,
            "seller": parsed_data.get('seller', {}),
            "reviews_count": parsed_data.get('reviews_count'),
            "trust_score": trust_score,
            "trend_score": trend_score,
            "category_name": parsed_data.get('category_name'),
            "category_slug": parsed_data.get('category_slug'),
            "listing_status": "draft",
            "provenance_raw_key": provenance_key,
            "shopify_product_id": None,
            "created_at": firestore.SERVER_TIMESTAMP,
            "updated_at": firestore.SERVER_TIMESTAMP,
        }

        # 5. Write to Firestore
        db.collection("products").document(product_id).set(product_doc)
        print(f"Successfully wrote product '{parsed_data['title']}' to Firestore with ID {product_id}")

    except Exception as e:
        print(f"An error occurred while processing {url}: {e}")

def discover_product_links(page, source_config):
    """Navigates to a seed URL and discovers product links based on the source config."""
    seed_url = source_config["url"]
    link_selector = source_config["link_selector"]
    print(f"Discovering links from seed: {source_config['name']} ({seed_url})")
    
    try:
        page.goto(seed_url, wait_until='load', timeout=SCRAPER_TIMEOUT)
        
        # This handles cookie consent banners on some sites like Amazon
        if page.locator('input[name="accept"]').is_visible():
            page.locator('input[name="accept"]').click()
            time.sleep(2)

        links = page.locator(link_selector).all()
        
        product_urls = set()
        for link in links[:15]: # Limit to 15 links per seed page
            href = link.get_attribute('href')
            if href:
                # Construct absolute URL
                if href.startswith('//'):
                    href = 'https:' + href
                elif href.startswith('/'):
                    parsed_seed = urlparse(seed_url)
                    href = f"{parsed_seed.scheme}://{parsed_seed.netloc}{href}"
                elif not href.startswith('http'):
                     href = urljoin(seed_url, href)

                # Basic validation to avoid mailto, javascript etc.
                if href.startswith('http'):
                    product_urls.add(href)
        
        print(f"Discovered {len(product_urls)} unique product links from {source_config['name']}.")
        return list(product_urls)
    except Exception as e:
        print(f"Failed to discover links from {seed_url}: {e}")
        return []


def main(test_url=None, dry_run=False):
    """Main execution function for the scraper."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(user_agent=SCRAPER_USER_AGENT)
        page = context.new_page()

        if test_url:
            print(f"--- Running in test mode for URL: {test_url} ---")
            if dry_run:
                print("--- DRY RUN: No data will be written. ---")
                page.goto(test_url, wait_until='networkidle', timeout=SCRAPER_TIMEOUT)
                html = page.content()
                data = parse_utils.parse_generic(html, test_url)
                print("Parsed data:", data)
            else:
                process_product_page(page, test_url)
        else:
            print("--- Running in discovery mode across all seed sources ---")
            for source_config in SEED_SOURCES:
                product_urls = discover_product_links(page, source_config)
                for url in product_urls:
                    time.sleep(random.uniform(5, 15)) # Polite delay with jitter
                    process_product_page(page, url)
                print(f"Finished processing links from seed {source_config['name']}")
                time.sleep(random.uniform(10, 20)) # Longer delay between sources

        browser.close()
    print("--- Scraper run finished ---")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Autonomous AI Store Scraper")
    parser.add_argument("--test-url", help="Scrape a single product URL for testing.")
    parser.add_argument("--dry-run", action="store_true", help="Parse and print data without writing to GCS/Firestore.")
    args = parser.parse_args()

    main(test_url=args.test_url, dry_run=args.dry_run)

    