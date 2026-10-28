#!/usr/bin/env python3
"""
Update Linktree HTML to use local thumbnails

This script updates data-preview attributes in the HTML file
to point to locally downloaded thumbnails instead of WordPress
screenshot URLs.

Usage:
    python3 update_thumbnails.py
"""

import os
import re
from urllib.parse import urlparse

# Configuration
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '../..'))
HTML_FILE = os.path.join(PROJECT_ROOT, 'index.html')
THUMBNAILS_DIR = os.path.join(PROJECT_ROOT, 'public/thumbnails')

# URL to thumbnail mapping
URL_TO_THUMBNAIL = {
    'linkedin.com': 'github_com.jpg',  # LinkedIn has no OG, use GitHub as fallback
    'diegonmarcos.com': 'diegonmarcos_com.jpg',
    'github.com': 'github_com.jpg',
    'diegonmarcos.github.io': 'diegonmarcos_github_io.jpg',
    'wakatime.com': 'wakatime_com.jpg',
    'linktree.diegonmarcos.com': 'linktree_diegonmarcos_com.jpg',
    'tidal.com': 'tidal_com.jpg',
    'youtube.com': 'youtube_com.jpg',
    'pinterest.com': 'pinterest_com.jpg',
    'instagram.com': 'instagram_com.jpg',
    'komoot.com': 'komoot_com.jpg',
    'strava.com': 'strava_com.jpg',
    'nomadmania.com': 'nomadmania_com.jpg',
    'google.com': 'google_com.jpg',
    'earth.google.com': 'google_com.jpg',
    'bucketlistjourney.net': 'bucketlistjourney_net.jpg',
}

def get_thumbnail_for_url(url):
    """Get the thumbnail filename for a given URL."""
    try:
        parsed = urlparse(url)
        domain = parsed.netloc.replace('www.', '')

        # Check if we have a thumbnail for this domain
        if domain in URL_TO_THUMBNAIL:
            return f"public/thumbnails/{URL_TO_THUMBNAIL[domain]}"

        # Fallback: return None to keep original
        return None
    except:
        return None

def update_html():
    """Update the HTML file with local thumbnail paths."""
    with open(HTML_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    # Pattern to match data-preview attributes with WordPress mshots URLs
    pattern = r'data-preview="https://s\.wordpress\.com/mshots/v1/([^"]*)"'

    replacements = 0

    def replace_preview(match):
        nonlocal replacements
        original_url = match.group(1)

        # Decode URL
        import urllib.parse
        decoded_url = urllib.parse.unquote(original_url)

        # Get local thumbnail
        local_thumbnail = get_thumbnail_for_url(decoded_url)

        if local_thumbnail:
            replacements += 1
            return f'data-preview="{local_thumbnail}"'
        else:
            # Keep original
            return match.group(0)

    # Perform replacement
    updated_content = re.sub(pattern, replace_preview, content)

    # Write back to file
    with open(HTML_FILE, 'w', encoding='utf-8') as f:
        f.write(updated_content)

    print("=" * 60)
    print("Updated Linktree HTML with Local Thumbnails")
    print("=" * 60)
    print(f"✅ Made {replacements} replacements")
    print(f"📝 Updated file: {HTML_FILE}")
    print("=" * 60)

if __name__ == '__main__':
    update_html()
