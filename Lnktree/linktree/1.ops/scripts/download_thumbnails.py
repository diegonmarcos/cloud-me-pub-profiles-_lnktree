#!/usr/bin/env python3
"""
Download OpenGraph Thumbnails for Linktree Links

This script extracts all external links from linktree/index.html,
fetches their OpenGraph images (og:image meta tags), and downloads
them to linktree/public/thumbnails/ for local use.

Usage:
    python3 download_thumbnails.py
"""

import os
import re
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin
import hashlib
import time

# Configuration
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '../..'))
HTML_FILE = os.path.join(PROJECT_ROOT, 'index.html')
THUMBNAILS_DIR = os.path.join(PROJECT_ROOT, 'public/thumbnails')
TIMEOUT = 10  # seconds
USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

# Create thumbnails directory if it doesn't exist
os.makedirs(THUMBNAILS_DIR, exist_ok=True)

def get_domain_slug(url):
    """Extract a clean domain name for filename."""
    parsed = urlparse(url)
    domain = parsed.netloc.replace('www.', '')
    # Clean domain for use in filename
    domain = re.sub(r'[^\w\-]', '_', domain)
    return domain

def fetch_og_image(url):
    """Fetch the OpenGraph image URL from a webpage."""
    try:
        print(f"  Fetching: {url}")
        headers = {'User-Agent': USER_AGENT}
        response = requests.get(url, headers=headers, timeout=TIMEOUT, allow_redirects=True)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'html.parser')

        # Try og:image first
        og_image = soup.find('meta', property='og:image')
        if og_image and og_image.get('content'):
            return og_image['content']

        # Try twitter:image as fallback
        twitter_image = soup.find('meta', attrs={'name': 'twitter:image'})
        if twitter_image and twitter_image.get('content'):
            return twitter_image['content']

        # Try twitter:image:src
        twitter_image_src = soup.find('meta', attrs={'property': 'twitter:image:src'})
        if twitter_image_src and twitter_image_src.get('content'):
            return twitter_image_src['content']

        print(f"  ⚠️  No OG image found for {url}")
        return None

    except requests.exceptions.Timeout:
        print(f"  ❌ Timeout fetching {url}")
        return None
    except Exception as e:
        print(f"  ❌ Error fetching {url}: {str(e)}")
        return None

def download_image(image_url, save_path):
    """Download an image from URL to local path."""
    try:
        # Handle relative URLs
        if not image_url.startswith('http'):
            print(f"  ⚠️  Skipping relative URL: {image_url}")
            return False

        headers = {'User-Agent': USER_AGENT}
        response = requests.get(image_url, headers=headers, timeout=TIMEOUT, stream=True)
        response.raise_for_status()

        with open(save_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        print(f"  ✅ Downloaded to {os.path.basename(save_path)}")
        return True

    except Exception as e:
        print(f"  ❌ Error downloading image: {str(e)}")
        return False

def extract_links_from_html():
    """Extract all external links from the HTML file."""
    with open(HTML_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    soup = BeautifulSoup(content, 'html.parser')
    links = []

    # Find all <a> tags with class="link" and href attribute
    for link in soup.find_all('a', class_='link', href=True):
        href = link['href']
        text = link.get_text(strip=True)

        # Skip anchors, javascript, mailto, and local links
        if href.startswith(('#', 'javascript:', 'mailto:', 'tel:')):
            continue

        # Skip download links
        if link.get('download'):
            continue

        # Only process external HTTP(S) links
        if href.startswith('http://') or href.startswith('https://'):
            links.append({
                'url': href,
                'text': text,
                'slug': get_domain_slug(href)
            })

    return links

def main():
    """Main function to download all thumbnails."""
    print("=" * 60)
    print("OpenGraph Thumbnail Downloader for Linktree")
    print("=" * 60)
    print()

    # Extract links
    print("📖 Parsing HTML file...")
    links = extract_links_from_html()
    print(f"✅ Found {len(links)} external links\n")

    # Download thumbnails
    downloaded = 0
    skipped = 0
    failed = 0

    for i, link in enumerate(links, 1):
        print(f"[{i}/{len(links)}] {link['text']}")
        print(f"  URL: {link['url']}")

        # Generate filename
        filename = f"{link['slug']}.jpg"
        save_path = os.path.join(THUMBNAILS_DIR, filename)

        # Skip if already exists
        if os.path.exists(save_path):
            print(f"  ⏭️  Already exists: {filename}")
            skipped += 1
            print()
            continue

        # Fetch OG image URL
        og_image_url = fetch_og_image(link['url'])

        if og_image_url:
            # Make absolute URL if relative
            og_image_url = urljoin(link['url'], og_image_url)

            # Download image
            success = download_image(og_image_url, save_path)
            if success:
                downloaded += 1
            else:
                failed += 1
        else:
            failed += 1

        print()
        time.sleep(0.5)  # Be nice to servers

    # Summary
    print("=" * 60)
    print("Summary:")
    print(f"  ✅ Downloaded: {downloaded}")
    print(f"  ⏭️  Skipped (already exist): {skipped}")
    print(f"  ❌ Failed: {failed}")
    print("=" * 60)
    print()
    print(f"📁 Thumbnails saved to: {THUMBNAILS_DIR}")
    print()

if __name__ == '__main__':
    main()
