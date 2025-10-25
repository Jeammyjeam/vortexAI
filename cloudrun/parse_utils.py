import hashlib
import re
from io import BytesIO
from urllib.parse import urlparse
import requests

from bs4 import BeautifulSoup
from PIL import Image
from google.cloud import storage

def generate_safe_filename(url):
    """Generates a safe, unique filename from a URL."""
    parsed_url = urlparse(url)
    # Use path and query, replacing slashes and special chars
    safe_path = re.sub(r'[^a-zA-Z0-9_-]', '_', parsed_url.path + parsed_url.query)
    # Hash the full URL to ensure uniqueness and add a short hash
    url_hash = hashlib.md5(url.encode('utf-8')).hexdigest()[:8]
    return f"{parsed_url.netloc}_{safe_path[:100]}_{url_hash}"

def download_image_and_hash(image_url, storage_client, bucket_name):
    """
    Downloads an image, computes its SHA256 hash, and uploads it to GCS.
    Returns the GCS path and the SHA256 hash.
    """
    try:
        response = requests.get(image_url, timeout=20)
        response.raise_for_status()
        image_data = response.content
        
        # Compute SHA256 hash
        sha256_hash = hashlib.sha256(image_data).hexdigest()

        # Verify it's a valid image and get format
        image = Image.open(BytesIO(image_data))
        image.verify() # verify that it is, in fact an image
        image_format = image.format.lower() if image.format else 'jpg'

        # Upload to GCS
        bucket = storage_client.bucket(bucket_name)
        # Use the hash as the filename to ensure content-based deduplication
        blob = bucket.blob(f"{sha256_hash}.{image_format}")

        if not blob.exists():
            blob.upload_from_string(image_data, content_type=f'image/{image_format}')

        gcs_uri = f"gs://{bucket_name}/{blob.name}"
        return gcs_uri, sha256_hash

    except requests.RequestException as e:
        print(f"Error downloading image {image_url}: {e}")
    except Exception as e:
        print(f"Error processing image {image_url}: {e}")
    
    return None, None


def parse_generic(html, url):
    """
    Parses the HTML of a product page to extract structured data.
    Uses BeautifulSoup with fallback selectors for common e-commerce platforms.
    """
    soup = BeautifulSoup(html, 'html.parser')
    
    data = {
        "title": None,
        "description": None,
        "price": None,
        "currency": None,
        "images": [],
        "seller": {"name": None, "rating": None},
        "reviews_count": None
    }

    # --- Title Extraction ---
    title_selectors = ['h1', '[class*="title"]', '#productTitle']
    for selector in title_selectors:
        element = soup.select_one(selector)
        if element:
            data['title'] = element.get_text(strip=True)
            break
            
    # --- Description Extraction ---
    desc_selectors = ['#feature-bullets', '#productDescription', '[class*="description"]']
    for selector in desc_selectors:
        element = soup.select_one(selector)
        if element:
            data['description'] = element.get_text(strip=True)
            break

    # --- Price & Currency Extraction ---
    price_selectors = ['[class*="price"]', '[class*="Price"]', '#price', '.price']
    for selector in price_selectors:
        element = soup.select_one(selector)
        if element:
            price_text = element.get_text(strip=True)
            # Regex to find numbers and currency symbols/codes
            match = re.search(r'([\$€£¥]?\s?)(\d{1,3}(?:,\d{3})*\.?\d{2})|(\d+\.?\d+)\s?([A-Z]{3})', price_text)
            if match:
                price_str = match.group(2) or match.group(3)
                currency_symbol = match.group(1) or match.group(4)
                
                if price_str:
                    data['price'] = float(price_str.replace(',', ''))

                if currency_symbol:
                    # Simple mapping for common symbols
                    currency_map = {'$': 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY'}
                    if currency_symbol.strip() in currency_map:
                         data['currency'] = currency_map[currency_symbol.strip()]
                    else:
                         data['currency'] = currency_symbol.strip()
                break

    # --- Image Extraction ---
    # Prioritize high-quality image selectors
    img_selectors = ['#imgBlkFront', '#landingImage', 'img[class*="product-image"]', 'div[class*="gallery"] img']
    image_urls = set()
    for selector in img_selectors:
        elements = soup.select(selector)
        for element in elements:
            src = element.get('src') or element.get('data-src')
            if src and src.startswith('http'):
                image_urls.add(src)
    data['images'] = list(image_urls)[:5] # Limit to 5 images

    return data