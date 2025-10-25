
import hashlib
import re
from io import BytesIO
from urllib.parse import urlparse
import requests

from bs4 import BeautifulSoup
from PIL import Image

def generate_safe_filename(url):
    """Generates a safe, unique filename from a URL."""
    parsed_url = urlparse(url)
    safe_path = re.sub(r'[^a-zA-Z0-9_-]', '_', parsed_url.path + parsed_url.query)
    url_hash = hashlib.md5(url.encode('utf-8')).hexdigest()[:8]
    return f"{parsed_url.netloc}_{safe_path[:100]}_{url_hash}"

def download_image_and_hash(image_url, storage_client, bucket_name):
    """
    Downloads an image, computes its SHA256 hash, and uploads it to GCS.
    Returns the GCS path and the SHA256 hash.
    """
    try:
        # Some websites provide relative URLs for images
        if image_url.startswith('//'):
            image_url = 'https:' + image_url

        response = requests.get(image_url, timeout=20, headers={'User-Agent': 'Mozilla/5.0'})
        response.raise_for_status()
        image_data = response.content
        
        sha256_hash = hashlib.sha256(image_data).hexdigest()

        image = Image.open(BytesIO(image_data))
        image.verify()
        image_format = image.format.lower() if image.format else 'jpg'

        bucket = storage_client.bucket(bucket_name)
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
        "reviews_count": None,
        "category_name": None,
        "category_slug": None,
    }

    # --- Title Extraction (Order matters: from specific to generic) ---
    title_selectors = ['#productTitle', 'h1.product-title', 'h1[class*="title"]', 'h1']
    for selector in title_selectors:
        element = soup.select_one(selector)
        if element:
            data['title'] = element.get_text(strip=True)
            break
            
    # --- Description Extraction ---
    desc_selectors = ['#feature-bullets', '#productDescription', 'div[class*="description"]']
    for selector in desc_selectors:
        element = soup.select_one(selector)
        if element:
            data['description'] = element.get_text(strip=True)
            break

    # --- Price & Currency Extraction ---
    price_selectors = ['.a-price .a-offscreen', '[class*="price"]', '[class*="Price"]', '#price', '.price']
    for selector in price_selectors:
        element = soup.select_one(selector)
        if element:
            price_text = element.get_text(strip=True)
            match = re.search(r'([\$€£¥]?\s?)(\d{1,3}(?:[,\.]\d{3})*[\.,]\d{2})|(\d+\.?\d+)\s?([A-Z]{3})', price_text)
            if match:
                price_str = match.group(2) or match.group(3)
                currency_symbol = match.group(1) or match.group(4)
                
                if price_str:
                    # Normalize price string to be a float (e.g., "1,234.56" -> 1234.56 or "1.234,56" -> 1234.56)
                    price_str = price_str.replace(',', 'TEMP').replace('.', '').replace('TEMP', '.')
                    data['price'] = float(price_str)

                if currency_symbol:
                    currency_map = {'$': 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY'}
                    clean_symbol = currency_symbol.strip()
                    if clean_symbol in currency_map:
                         data['currency'] = currency_map[clean_symbol]
                    elif len(clean_symbol) == 3: # Assume ISO code like "USD"
                         data['currency'] = clean_symbol
                
                # If currency is not found, try to infer from domain
                if not data['currency']:
                    if 'amazon.com' in url or '.com' in url: data['currency'] = 'USD'
                    if 'amazon.co.uk' in url: data['currency'] = 'GBP'
                    if 'amazon.de' in url: data['currency'] = 'EUR'

                if data['price'] and data['currency']:
                    break

    # --- Image Extraction ---
    img_selectors = ['#imgTagWrapperId img', '#imgBlkFront', '#landingImage', 'img[class*="product-image"]', 'div[class*="gallery"] img']
    image_urls = set()
    for selector in img_selectors:
        elements = soup.select(selector)
        for element in elements:
            src = element.get('src') or element.get('data-src')
            if src and src.startswith('http') and not src.endswith('.gif'):
                # Amazon sometimes serves tiny 1x1 pixels, try to filter them
                if 'images/I/01' not in src and 'images/G/01' not in src:
                    image_urls.add(src.strip())
    data['images'] = list(image_urls)[:5]
    
    # --- Category Extraction (from breadcrumbs) ---
    breadcrumb_selectors = ['#wayfinding-breadcrumbs_feature_div ul a', '#nav-breadcrumbs a', '[class*="breadcrumb"] a', '.a-breadcrumb a']
    for selector in breadcrumb_selectors:
        elements = soup.select(selector)
        if len(elements) > 1:
            # Last link is often current page, second to last is the category
            category_element = elements[-2] 
            category_name = category_element.get_text(strip=True)
            if category_name.lower() not in ['home', 'products', 'back to results']:
                data['category_name'] = category_name
                slug = re.sub(r'[^a-z0-9]+', '-', category_name.lower()).strip('-')
                data['category_slug'] = slug
                break

    return data

    