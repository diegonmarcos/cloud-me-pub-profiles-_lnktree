#!/usr/bin/env python3
"""
Create placeholder images for Venture 1 and Venture 2 cards
with glassmorphism aesthetic
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_venture_image(filename, title, gradient_colors):
    """Create a venture card image with gradient background and text"""

    # Image dimensions (matching existing cards)
    width = 580
    height = 300

    # Create new image with gradient
    image = Image.new('RGB', (width, height))
    draw = ImageDraw.Draw(image)

    # Draw gradient background
    for y in range(height):
        # Calculate gradient color
        ratio = y / height
        r = int(gradient_colors[0][0] + (gradient_colors[1][0] - gradient_colors[0][0]) * ratio)
        g = int(gradient_colors[0][1] + (gradient_colors[1][1] - gradient_colors[0][1]) * ratio)
        b = int(gradient_colors[0][2] + (gradient_colors[1][2] - gradient_colors[0][2]) * ratio)

        draw.rectangle([(0, y), (width, y + 1)], fill=(r, g, b))

    # Add some noise/texture for glassmorphism feel
    for i in range(0, width, 4):
        for j in range(0, height, 4):
            # Random slight variations in brightness
            import random
            variation = random.randint(-10, 10)
            pixel = image.getpixel((i, j))
            new_pixel = tuple(max(0, min(255, c + variation)) for c in pixel)
            draw.rectangle([(i, j), (i + 3, j + 3)], fill=new_pixel)

    # Try to use a nice font, fallback to default
    try:
        # Try common font paths
        font_size = 60
        font_paths = [
            '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
            '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
            '/System/Library/Fonts/Helvetica.ttc',
            'C:\\Windows\\Fonts\\Arial.ttf'
        ]

        font = None
        for font_path in font_paths:
            if os.path.exists(font_path):
                font = ImageFont.truetype(font_path, font_size)
                break

        if font is None:
            font = ImageFont.load_default()
    except:
        font = ImageFont.load_default()

    # Draw title text in center
    text_color = (255, 255, 255)

    # Get text bounding box
    bbox = draw.textbbox((0, 0), title, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    # Center text
    text_x = (width - text_width) // 2
    text_y = (height - text_height) // 2

    # Draw text with shadow for depth
    shadow_offset = 3
    draw.text((text_x + shadow_offset, text_y + shadow_offset), title,
              fill=(0, 0, 0, 128), font=font)
    draw.text((text_x, text_y), title, fill=text_color, font=font)

    # Add a subtle border effect
    border_color = (255, 255, 255, 50)
    draw.rectangle([(0, 0), (width - 1, height - 1)], outline=(200, 200, 200))

    # Save image
    output_path = os.path.join('images', filename)
    image.save(output_path, 'PNG')
    print(f"Created: {output_path}")

# Create both venture images
if __name__ == '__main__':
    # Venture 1: Purple to blue gradient (tech/innovation theme)
    create_venture_image(
        'venture1.png',
        'VENTURE 1',
        [(75, 0, 130), (0, 100, 200)]  # Purple to blue
    )

    # Venture 2: Orange to pink gradient (creative/dynamic theme)
    create_venture_image(
        'venture2.png',
        'VENTURE 2',
        [(200, 50, 100), (255, 100, 50)]  # Pink to orange
    )

    print("\nVenture images created successfully!")
