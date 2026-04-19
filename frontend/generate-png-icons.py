#!/usr/bin/env python3
"""
Generate PNG tab bar icons for KapGame Cinema Glass theme
"""
from PIL import Image, ImageDraw
import os

indigo = (99, 102, 241)
dim = (107, 114, 128)
bg_top = (18, 18, 31)
bg_bottom = (5, 5, 6)

def create_icon(name, active):
    """Create a tab bar icon with cinema glass style"""
    size = 81
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))

    # Draw gradient background
    for y in range(size):
        ratio = y / size
        r = int(bg_top[0] + (bg_bottom[0] - bg_top[0]) * ratio)
        g = int(bg_top[1] + (bg_bottom[1] - bg_top[1]) * ratio)
        b = int(bg_top[2] + (bg_bottom[2] - bg_top[2]) * ratio)
        for x in range(size):
            img.putpixel((x, y), (r, g, b, 255))

    # Create color
    color_tuple = indigo if active else dim

    draw = ImageDraw.Draw(img)

    if 'shop' in name:
        # Shopping bag / card pack
        cx, cy = size // 2, size // 2
        padding = 22
        # Top triangle
        draw.polygon([
            (cx - 12, cy - 10),
            (cx, cy - 18),
            (cx + 12, cy - 10),
        ], fill=color_tuple if not active else None, outline=color_tuple)
        # Bag body
        draw.rectangle([cx - 14, cy - 8, cx + 14, cy + 16], fill=color_tuple if active else None, outline=color_tuple, width=1)
        # Handle
        draw.arc([cx - 6, cy - 18, cx + 6, cy - 10], 0, 180, fill=color_tuple, width=2)

    elif 'home' in name:
        # Battle / crossed swords
        cx, cy = size // 2, size // 2
        # Cross pattern
        offset = 12
        # Top line
        draw.line([cx, cy - 20, cx, cy - 2], fill=color_tuple, width=3)
        # Bottom line
        draw.line([cx, cy + 2, cx, cy + 20], fill=color_tuple, width=3)
        # Horizontal line
        draw.line([cx - 18, cy, cx - 3, cy], fill=color_tuple, width=3)
        draw.line([cx + 3, cy, cx + 18, cy], fill=color_tuple, width=3)
        # Center circle
        draw.ellipse([cx - 5, cy - 5, cx + 5, cy + 5], fill=color_tuple)
        # Outer ring
        draw.ellipse([cx - 12, cy - 12, cx + 12, cy + 12], outline=color_tuple, width=1)

    elif 'chat' in name:
        # Chat bubbles
        cx, cy = size // 2, size // 2
        # Main bubble
        draw.rounded_rectangle([12, 12, 60, 52], radius=8, outline=color_tuple, width=2)
        # Bubble tail
        draw.polygon([(20, 52), (28, 58), (28, 52)], fill=color_tuple if active else None, outline=color_tuple)
        # Lines inside
        draw.line([18, 24, 40, 24], fill=color_tuple, width=2)
        draw.line([18, 34, 34, 34], fill=color_tuple, width=2)
        # Badge for active
        if active:
            draw.ellipse([54, 54, 70, 70], fill=indigo)
            draw.text((60, 57), "3", fill=(5, 5, 6))

    # Active indicator bar at bottom
    if active:
        draw.rounded_rectangle([4, 74, 77, 78], radius=2, fill=indigo)

    return img

# Generate icons
icons_dir = os.path.join(os.path.dirname(__file__), 'images', 'tab')
os.makedirs(icons_dir, exist_ok=True)

files = [
    ('shop.png', False),
    ('shop-active.png', True),
    ('home.png', False),
    ('home-active.png', True),
    ('chat.png', False),
    ('chat-active.png', True),
]

for name, active in files:
    img = create_icon(name, active)
    path = os.path.join(icons_dir, name)
    img.save(path, 'PNG')
    print(f'Created: {name}')

print('\nDone! PNG tab icons generated with new Cinema Glass theme.')