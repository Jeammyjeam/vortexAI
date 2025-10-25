
import os
import time
import random
import uuid
from urllib.parse import urlparse, urljoin
import argparse
from http.server import BaseHTTPRequestHandler, HTTPServer
import threading

from playwright.sync_api import sync_playwright
from google.cloud import firestore, storage
from dotenv import load_dotenv

import parse_utils

# Load environment variables for local development
load_dotenv()

# --- Configuration ---
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT")
RAW_BUCKET_NAME = os.getenv("RAW_BUCKET")
IMAGE_BUCKET_NAME = os.getenv("IMAGE_BUCKET")

SCRAPER_USER_AGENT = os.getenv("SCRAPER_USER_AGENT", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36")
SCRAPER_TIMEOUT = int(os.getenv("SCRAPER_TIMEOUT", 60)) * 1000

# --- Seed URLs for product discovery ---
SEED_SOURCES = [
    {
        "name": "AliExpress - Trending",
        "url": "https://www.aliexpress.com/category/100003109/computer-office.html",
        "link_selector": 'a[href*="/item/"]',
    },
    {
        "name": "Amazon - Bestsellers",
        "url": "https://www.amazon.com/bestsellers",
        "link_selector": 'a.a-link-normal[href*="/dp/"]',
    },
]

# --- Initialize Google Cloud Clients ---
try:
    db = firestore.Client(project=FIREBASE_PROJECT_ID)
    storage_client = storage.Client(project=FIREBASE_PROJECT_ID)
except Exception as e:
    print(f"FATAL: Could not initialize Google Cloud clients. Ensure GOOGLE_APPLICATION_CREDENTIALS is set for local runs. Error: {e}")
    db = None
    storage_client = None

def save_raw_html_to_gcs(html_content, url):
    """Saves the raw HTML content to a GCS bucket."""
    if not storage_client or not RAW_BUCKET_NAME:
        print("Warning: GCS client or RAW_BUCKET not configured. Skipping GCS save.")
        return None
    try:
        bucket = storage_client.bucket(RAW_BUCKET_NAME)
        filename = f"{time.strftime('%Y%m%d-%H%M%S')}_{parse_utils.generate_safe_filename(url)}.html"
        blob = bucket.blob(filename)
        blob.upload_from_string(html_content, content_type='text/html')
        print(f"Saved raw HTML for {url} to {blob.name}")
        return f"gs://{RAW_BUCKET_NAME}/{blob.name}"
    except Exception as e:
        print(f"Error saving HTML to GCS for {url}: {e}")
        return None

def process_product_page(page, url, dry_run=False):
    """Fetches, parses, and (optionally) stores data for a single product URL."""
    print(f"Processing product page: {url}")
    try:
        page.goto(url, wait_until='domcontentloaded', timeout=SCRAPER_TIMEOUT)
        html_content = page.content()

        parsed_data = parse_utils.parse_generic(html_content, url)
        if not parsed_data.get('title') or not parsed_data.get('price'):
            print(f"Could not parse required fields (title, price) for {url}. Skipping.")
            return

        print(f"  - Parsed Title: {parsed_data['title']}")
        print(f"  - Parsed Price: {parsed_data.get('price')} {parsed_data.get('currency')}")
        
        if dry_run:
            print("--- DRY RUN: Would write the following data to Firestore ---")
            print(parsed_data)
            return

        if not db:
            print("FATAL: Firestore client not available. Exiting.")
            return

        provenance_key = save_raw_html_to_gcs(html_content, url)
        image_gcs_uris = parsed_data.get('images', [])

        product_doc = {
            "title": parsed_data['title'],
            "description": parsed_data['description'],
            "price": parsed_data['price'],
            "currency": parsed_data['currency'],
            "images": image_gcs_uris,
            "source_url": url,
            "provenance_raw_key": provenance_key,
            "listing_status": "draft",
            "enriched": { "seo_title": "", "captions": [] },
            "haram_filter": { "haram": False, "reasons": [] },
            "shopify_product_id": None,
            "trend_score": random.uniform(0.5, 0.9),
            "trust_score": random.uniform(0.6, 0.9),
            "created_at": firestore.SERVER_TIMESTAMP,
        }

        doc_ref = db.collection("products").document()
        doc_ref.set(product_doc)
        print(f"Successfully wrote product '{parsed_data['title']}' to Firestore with ID {doc_ref.id}")

    except Exception as e:
        print(f"An error occurred while processing {url}: {e}")

def discover_product_links(page, source_config):
    """Navigates to a seed URL and discovers product links."""
    print(f"\nDiscovering links from seed: {source_config['name']} ({source_config['url']})")
    try:
        page.goto(source_config["url"], wait_until='load', timeout=SCRAPER_TIMEOUT)
        
        time.sleep(2)
        if page.locator('input[name="accept"]').is_visible():
            page.locator('input[name="accept"]').click()
        elif page.locator('button:has-text("Accept")').is_visible():
             page.locator('button:has-text("Accept")').first.click()

        links = page.locator(source_config["link_selector"]).all()
        
        product_urls = set()
        base_url = f"{urlparse(source_config['url']).scheme}://{urlparse(source_config['url']).netloc}"
        for link in links[:5]:
            href = link.get_attribute('href')
            if href:
                if href.startswith('//'):
                    href = 'https:' + href
                elif href.startswith('/'):
                    href = urljoin(base_url, href)
                
                if href.startswith('http'):
                    product_urls.add(href)
        
        print(f"Discovered {len(product_urls)} unique product links.")
        return list(product_urls)
    except Exception as e:
        print(f"Failed to discover links from {source_config['url']}: {e}")
        return []

def run_scraper_logic(test_url=None, dry_run=False):
    """Main execution function for the scraper."""
    print("--- Scraper run initiated ---")
    if db:
        db.collection("system_logs").document("scraper_status").set({
            "last_start": firestore.SERVER_TIMESTAMP,
            "status": "running"
        })

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(user_agent=SCRAPER_USER_AGENT)
        page = context.new_page()

        if test_url:
            print(f"--- Running in single URL test mode ---")
            process_product_page(page, test_url, dry_run)
        else:
            print("--- Running in discovery mode across all seed sources ---")
            all_urls = []
            for source_config in SEED_SOURCES:
                all_urls.extend(discover_product_links(page, source_config))
            
            print(f"\n--- Starting to process {len(all_urls)} discovered products ---")
            for url in all_urls:
                process_product_page(page, url, dry_run)
                time.sleep(random.uniform(3, 8))

        browser.close()

    if db:
        db.collection("system_logs").document("scraper_status").update({
            "last_finish": firestore.SERVER_TIMESTAMP,
            "status": "idle"
        })
    print("\n--- Scraper run finished ---")

# --- HTTP Server for Cloud Run ---
class ScraperRequestHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        print("Received POST request, starting scraper...")
        # Run the scraper logic in a separate thread to avoid blocking the HTTP response
        scraper_thread = threading.Thread(target=run_scraper_logic)
        scraper_thread.start()
        
        self.send_response(202) # Accepted
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(b'{"status": "Scraper job started"}')

def run_server(port=8080):
    server_address = ('', port)
    httpd = HTTPServer(server_address, ScraperRequestHandler)
    print(f"Starting httpd server on port {port}")
    httpd.serve_forever()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Vortex AI Grid Scraper")
    parser.add_argument("--test-url", help="Scrape a single product URL instead of discovering from seeds.")
    parser.add_argument("--dry-run", action="store_true", help="Parse and print data without writing to GCS/Firestore.")
    args = parser.parse_args()

    # If --test-url or --dry-run is used, run directly without server
    if args.test_url or args.dry_run:
        run_scraper_logic(test_url=args.test_url, dry_run=args.dry_run)
    else:
        # For Cloud Run, start the server
        port = int(os.environ.get("PORT", 8080))
        run_server(port)
