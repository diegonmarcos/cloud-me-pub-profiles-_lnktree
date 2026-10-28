#!/usr/bin/env python3
"""
Generate OG/banner thumbnails for front-end projects.
Style matches existing nexus_thumbnail.png and landpage_thumbnail.png:
  - 1200x630 (OG standard)
  - Dark gradient background with geometric pattern
  - "Diego Nepomuceno Marcos" + "*/diegonmarcos"
  - Circular profile photo on the right
  - Project name + subtitle at bottom left
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os
import math
import random

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
WIDTH, HEIGHT = 1200, 630
PROFILE_PHOTO = os.path.join(SCRIPT_DIR, "images", "diego_linkedin-picture.jpg")
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "thumbnails_new")

# Font discovery
FONT_PATHS = [
    "/run/current-system/sw/share/X11/fonts/DejaVuSans-Bold.ttf",
    "/run/current-system/sw/share/X11/fonts/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
]
FONT_PATHS_REGULAR = [
    "/run/current-system/sw/share/X11/fonts/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
]


def find_font(paths, size):
    for p in paths:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def draw_gradient(draw, w, h, color_top, color_bottom):
    """Vertical gradient fill."""
    for y in range(h):
        ratio = y / h
        r = int(color_top[0] + (color_bottom[0] - color_top[0]) * ratio)
        g = int(color_top[1] + (color_bottom[1] - color_top[1]) * ratio)
        b = int(color_top[2] + (color_bottom[2] - color_top[2]) * ratio)
        draw.line([(0, y), (w, y)], fill=(r, g, b))


def draw_hexagons(draw, w, h, color, alpha=30):
    """Draw hexagonal grid pattern (like nexus thumbnail)."""
    hex_size = 60
    for row in range(-1, h // hex_size + 2):
        for col in range(-1, w // hex_size + 2):
            cx = col * hex_size * 1.5
            cy = row * hex_size * math.sqrt(3) + (col % 2) * hex_size * math.sqrt(3) / 2
            points = []
            for i in range(6):
                angle = math.pi / 3 * i + math.pi / 6
                px = cx + hex_size * 0.4 * math.cos(angle)
                py = cy + hex_size * 0.4 * math.sin(angle)
                points.append((px, py))
            if len(points) == 6:
                c = (*color, alpha)
                draw.polygon(points, outline=c)


def draw_triangles(draw, w, h, color, alpha=25):
    """Draw connected triangle/node pattern (like landpage thumbnail)."""
    random.seed(42)
    nodes = [(random.randint(0, w), random.randint(0, h)) for _ in range(40)]
    c = (*color, alpha)
    # Connect nearby nodes
    for i, n1 in enumerate(nodes):
        for n2 in nodes[i + 1:]:
            dist = math.hypot(n1[0] - n2[0], n1[1] - n2[1])
            if dist < 250:
                draw.line([n1, n2], fill=c, width=1)
    # Draw nodes
    for n in nodes:
        draw.ellipse([n[0] - 3, n[1] - 3, n[0] + 3, n[1] + 3], fill=c)


def draw_leaves(draw, w, h, color, alpha=20):
    """Draw leaf/botanical pattern for leafy theme."""
    random.seed(99)
    c = (*color, alpha)
    for _ in range(25):
        cx, cy = random.randint(0, w), random.randint(0, h)
        size = random.randint(20, 50)
        angle = random.uniform(0, math.pi * 2)
        # Simple leaf shape: two arcs
        points = []
        for t in range(20):
            t_norm = t / 19
            # Leaf curve
            lx = cx + size * t_norm * math.cos(angle) + size * 0.3 * math.sin(t_norm * math.pi) * math.sin(angle)
            ly = cy + size * t_norm * math.sin(angle) - size * 0.3 * math.sin(t_norm * math.pi) * math.cos(angle)
            points.append((lx, ly))
        for t in range(19, -1, -1):
            t_norm = t / 19
            lx = cx + size * t_norm * math.cos(angle) - size * 0.3 * math.sin(t_norm * math.pi) * math.sin(angle)
            ly = cy + size * t_norm * math.sin(angle) + size * 0.3 * math.sin(t_norm * math.pi) * math.cos(angle)
            points.append((lx, ly))
        if len(points) >= 3:
            draw.polygon(points, outline=c)
        # Leaf vein
        draw.line(
            [(cx, cy), (cx + size * math.cos(angle), cy + size * math.sin(angle))],
            fill=c, width=1,
        )


def draw_bolts(draw, w, h, color, alpha=20):
    """Draw angular/electric bolt pattern for stark theme."""
    random.seed(77)
    c = (*color, alpha)
    for _ in range(15):
        x, y = random.randint(0, w), random.randint(0, h)
        for seg in range(random.randint(3, 6)):
            nx = x + random.randint(-80, 80)
            ny = y + random.randint(20, 60)
            draw.line([(x, y), (nx, ny)], fill=c, width=2)
            x, y = nx, ny


def add_profile_photo(img, photo_path, cx, cy, radius):
    """Add circular profile photo."""
    if not os.path.exists(photo_path):
        print(f"  Warning: profile photo not found at {photo_path}")
        return

    photo = Image.open(photo_path).convert("RGBA")
    # Crop to square
    size = min(photo.size)
    left = (photo.width - size) // 2
    top = (photo.height - size) // 2
    photo = photo.crop((left, top, left + size, top + size))
    photo = photo.resize((radius * 2, radius * 2), Image.LANCZOS)

    # Create circular mask
    mask = Image.new("L", (radius * 2, radius * 2), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.ellipse([0, 0, radius * 2 - 1, radius * 2 - 1], fill=255)

    # White border ring
    border = 4
    ring = Image.new("RGBA", (radius * 2 + border * 2, radius * 2 + border * 2), (0, 0, 0, 0))
    ring_draw = ImageDraw.Draw(ring)
    ring_draw.ellipse([0, 0, radius * 2 + border * 2 - 1, radius * 2 + border * 2 - 1], fill=(255, 255, 255, 180))

    img.paste(ring, (cx - radius - border, cy - radius - border), ring)
    img.paste(photo, (cx - radius, cy - radius), mask)


def create_thumbnail(project_name, subtitle, gradient_top, gradient_bottom,
                     accent_color, pattern_fn, icon_char=""):
    """Create a branded OG thumbnail."""
    # Base image with alpha for pattern overlay
    img = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 255))
    draw = ImageDraw.Draw(img)

    # Gradient background
    draw_gradient(draw, WIDTH, HEIGHT, gradient_top, gradient_bottom)

    # Geometric pattern overlay
    pattern_fn(draw, WIDTH, HEIGHT, accent_color)

    # Subtle corner vignette
    vignette = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    vig_draw = ImageDraw.Draw(vignette)
    for i in range(80):
        alpha = int(60 * (1 - i / 80))
        vig_draw.rectangle([i, i, WIDTH - i, HEIGHT - i], outline=(0, 0, 0, alpha))
    img = Image.alpha_composite(img, vignette)

    draw = ImageDraw.Draw(img)

    # Fonts
    font_name = find_font(FONT_PATHS, 62)
    font_handle = find_font(FONT_PATHS_REGULAR, 26)
    font_project = find_font(FONT_PATHS, 36)
    font_subtitle = find_font(FONT_PATHS_REGULAR, 22)

    # Text: "Diego Nepomuceno Marcos"
    name_x, name_y = 60, 120
    # Shadow
    draw.text((name_x + 2, name_y + 2), "Diego", fill=(0, 0, 0, 120), font=font_name)
    draw.text((name_x, name_y), "Diego", fill=(255, 255, 255, 255), font=font_name)

    draw.text((name_x + 2, name_y + 72), "Nepomuceno", fill=(0, 0, 0, 120), font=font_name)
    draw.text((name_x, name_y + 70), "Nepomuceno", fill=(255, 255, 255, 255), font=font_name)

    draw.text((name_x + 2, name_y + 142), "Marcos", fill=(0, 0, 0, 120), font=font_name)
    draw.text((name_x, name_y + 140), "Marcos", fill=(255, 255, 255, 255), font=font_name)

    # Handle: "*/diegonmarcos"
    handle_y = name_y + 215
    draw.text((name_x, handle_y), "*/diegonmarcos", fill=(*accent_color, 200), font=font_handle)

    # Project name + subtitle at bottom left
    proj_y = HEIGHT - 100
    if icon_char:
        draw.text((name_x, proj_y), f"{icon_char}  {project_name}", fill=(255, 255, 255, 255), font=font_project)
    else:
        draw.text((name_x, proj_y), project_name, fill=(255, 255, 255, 255), font=font_project)
    draw.text((name_x, proj_y + 42), subtitle, fill=(200, 200, 200, 200), font=font_subtitle)

    # Profile photo (right side)
    photo_cx = WIDTH - 240
    photo_cy = HEIGHT // 2 - 20
    photo_radius = 130
    add_profile_photo(img, PROFILE_PHOTO, photo_cx, photo_cy, photo_radius)

    # Accent line under name block
    line_y = handle_y + 35
    draw.line([(name_x, line_y), (name_x + 200, line_y)], fill=(*accent_color, 120), width=2)

    # Convert to RGB for saving as PNG/JPG
    final = img.convert("RGB")

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    out_path = os.path.join(OUTPUT_DIR, f"{project_name.lower()}_thumbnail.png")
    final.save(out_path, "PNG", optimize=True)
    print(f"Created: {out_path} ({WIDTH}x{HEIGHT})")
    return out_path


if __name__ == "__main__":
    # Leafy: green/nature theme — plant tracker with shaders
    create_thumbnail(
        project_name="Leafy",
        subtitle="Where Edge Technology meets Design",
        gradient_top=(15, 45, 30),       # Dark forest green
        gradient_bottom=(10, 25, 20),    # Near black green
        accent_color=(100, 200, 120),    # Fresh green
        pattern_fn=draw_leaves,
        icon_char="\U0001F331",          # seedling emoji
    )

    # Stark: bold/professional theme — venture/business site
    create_thumbnail(
        project_name="Stark",
        subtitle="Ventures & Innovation",
        gradient_top=(25, 25, 45),       # Dark navy/slate
        gradient_bottom=(15, 15, 25),    # Near black blue
        accent_color=(180, 200, 255),    # Ice blue accent
        pattern_fn=draw_bolts,
        icon_char="\u26A1",             # bolt
    )

    print("\nDone! Thumbnails saved to thumbnails_new/")
