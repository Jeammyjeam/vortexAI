
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
    Downloads an image, computes its SHA256 hash, and uploads it to GCS if it doesn't exist.
    Returns the GCS path and the SHA256 hash. Returns (None, None) on failure.
    """
    try:
        # Handle protocol-relative URLs
        if image_url.startswith('//'):
            image_url = 'https:' + image_url

        response = requests.get(image_url, timeout=20, headers={'User-Agent': 'Mozilla/5.0'})
        response.raise_for_status()
        image_data = response.content
        
        sha256_hash = hashlib.sha256(image_data).hexdigest()

        # Check image format without saving locally
        image = Image.open(BytesIO(image_data))
        image.verify()
        image_format = image.format.lower() if image.format else 'jpg'

        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(f"{sha256_hash}.{image_format}")

        # Upload only if it doesn't already exist
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
    Parses the HTML of a product page to extract rich, structured data.
    """
    soup = BeautifulSoup(html, 'html.parser')
    
    data = {
        "title": None,
        "normalized_title": None,
        "description": None,
        "price": None,
        "currency": None,
        "images": [],
        "image_hashes": [],
        "seller": {"name": None, "rating": None},
        "reviews_count": None,
        "category_name": None,
        "category_slug": None,
        "source_product_id": None,
        "source_domain": urlparse(url).netloc,
    }

    # --- Source Product ID Extraction (e.g., Amazon ASIN) ---
    if 'amazon' in data['source_domain']:
        match = re.search(r'/(dp|gp/product)/([A-Z0-9]{10})', url)
        if match:
            data['source_product_id'] = match.group(2)
    elif 'aliexpress' in data['source_domain']:
        match = re.search(r'/item/(\d+)\.html', url)
        if match:
            data['source_product_id'] = match.group(1)

    # --- Title Extraction ---
    title_selectors = ['#productTitle', 'h1.product-title', 'h1[class*="title"]', 'h1']
    for selector in title_selectors:
        element = soup.select_one(selector)
        if element:
            data['title'] = element.get_text(strip=True)
            data['normalized_title'] = re.sub(r'[^a-z0-9]+', '-', data['title'].lower()).strip('-')
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
            match = re.search(r'([\$€£¥]?\s?)(\d{1,3}(?:[,\.]\d{3})*[\.,]\d{2})|(\d+\.?\d*)\s?([A-Z]{3})?', price_text)
            if match:
                price_str = match.group(2) or match.group(3)
                currency_symbol_or_code = match.group(1) or match.group(4)
                
                if price_str:
                    price_str_cleaned = re.sub(r'[^\d\.]', '', price_str.replace(',', '.'))
                    if price_str_cleaned.count('.') > 1:
                        price_str_cleaned = price_str_cleaned.replace('.', '', price_str_cleaned.count('.') - 1)
                    data['price'] = float(price_str_cleaned)

                if currency_symbol_or_code:
                    currency_map = {'$': 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY'}
                    clean_symbol = currency_symbol_or_code.strip()
                    if clean_symbol in currency_map:
                         data['currency'] = currency_map[clean_symbol]
                    elif len(clean_symbol) == 3:
                         data['currency'] = clean_symbol
                
                if not data['currency']:
                    domain = data['source_domain']
                    if 'amazon.com' in domain or '.com' in domain: data['currency'] = 'USD'
                    if 'amazon.co.uk' in domain: data['currency'] = 'GBP'
                    if 'amazon.de' in domain: data['currency'] = 'EUR'
                    else: data['currency'] = 'USD' # Default fallback

                if data['price'] and data['currency']:
                    break

    # --- Image Extraction ---
    img_selectors = ['#imgTagWrapperId img', '#imgBlkFront', '#landingImage', 'img[class*="product-image"]', 'div[class*="gallery"] img']
    image_urls = set()
    for selector in img_selectors:
        elements = soup.select(selector)
        for element in elements:
            src = element.get('src') or element.get('data-src')
            if src and src.startswith('http') and not src.endswith(('.gif', '.svg')):
                image_urls.add(src.strip())
    data['images'] = list(image_urls)[:5]
    
    # --- Category Extraction (from breadcrumbs) ---
    breadcrumb_selectors = ['#wayfinding-breadcrumbs_feature_div ul a', '#nav-breadcrumbs a', '[class*="breadcrumb"] a', '.a-breadcrumb a']
    for selector in breadcrumb_selectors:
        elements = soup.select(selector)
        if len(elements) > 1:
            category_element = elements[-2] 
            category_name = category_element.get_text(strip=True)
            if category_name.lower() not in ['home', 'products', 'back to results']:
                data['category_name'] = category_name
                data['category_slug'] = re.sub(r'[^a-z0-9]+', '-', category_name.lower()).strip('-')
                break

    return data
