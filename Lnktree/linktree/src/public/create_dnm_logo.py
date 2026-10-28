#!/usr/bin/env python3
"""
Create a simple DNM logo for QR code
"""
from PIL import Image, ImageDraw, ImageFont

def create_dnm_logo(output_path="dnm_logo.png", size=200, bg_color="white", text_color="black"):
    """Create a simple DNM text logo"""

    # Create image
    img = Image.new('RGB', (size, size), bg_color)
    draw = ImageDraw.Draw(img)

    # Try to use a nice font, fallback to default
    try:
        # Try different font sizes and paths
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", size // 3)
    except:
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf", size // 3)
        except:
            # Fallback to default font
            font = ImageFont.load_default()

    # Text to draw
    text = "DNM"

    # Get text bounding box to center it
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    # Calculate position to center text
    x = (size - text_width) // 2
    y = (size - text_height) // 2

    # Draw text
    draw.text((x, y), text, fill=text_color, font=font)

    # Save
    img.save(output_path)
    print(f"Logo created: {output_path} ({size}x{size}px)")
    return output_path

if __name__ == "__main__":
    create_dnm_logo()
