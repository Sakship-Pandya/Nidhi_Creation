import random
import psycopg2
import urllib.request
from datetime import datetime
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from core.config import get_connection

def download_image(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        return response.read()

def seed_db():
    print("Connecting to DB...")
    conn = get_connection()
    cur = conn.cursor()

    # 1. Categories
    print("Seeding Categories...")
    cats = [
        ('branding', 'Branding & Identity', 'Corporate identity and branding works.'),
        ('marketing', 'Digital Marketing', 'Ad campaigns, SEO, and socials.'),
        ('ui-ux', 'UI/UX Design', 'App and web design interfaces.'),
        ('print', 'Print Media', 'Brochures, flyers, and physical prints.'),
        ('packaging', 'Packaging Design', 'Box designs and product wraps.')
    ]
    cur.execute("TRUNCATE TABLE categories CASCADE;")
    for idx, (slug, name, desc) in enumerate(cats):
        cur.execute(
            "INSERT INTO categories (slug, name, description, display_order) VALUES (%s, %s, %s, %s)",
            (slug, name, desc, idx)
        )

    # 2. Projects & Images & Bridging
    print("Seeding Projects and Images (this might take a few seconds)...")
    cur.execute("TRUNCATE TABLE projects CASCADE;")
    
    projects_data = [
        ('Aura Skincare', 'Complete brand identity and packaging design for a natural skincare line.', ['branding', 'packaging']),
        ('FinTech Dash', 'A modern, sleek dashboard for tracking financial analytics.', ['ui-ux']),
        ('Local Coffee Co.', 'Warm and inviting print media and branding for a boutique coffee shop.', ['branding', 'print']),
        ('Neon Nights', 'Vibrant digital marketing campaign for an electronic music festival.', ['marketing']),
        ('EcoWear App', 'Mobile application design focusing on sustainable fashion choices.', ['ui-ux']),
        ('Gourmet Burger Box', 'Playful and premium packaging for high-end burgers.', ['packaging', 'print']),
        ('Lunar Real Estate', 'Corporate identity and website design for a modern real estate agency.', ['branding', 'ui-ux']),
        ('FitPulse Campaign', 'High-energy social media ads and digital marketing execution.', ['marketing']),
        ('Zenith Architecture', 'Minimalist brochure and print identity for an architecture firm.', ['print']),
        ('Aqua Pure', 'Clean and refreshing water bottle packaging and brand guidelines.', ['packaging', 'branding'])
    ]

    for title, desc, p_cats in projects_data:
        cur.execute(
            "INSERT INTO projects (title, description) VALUES (%s, %s) RETURNING id",
            (title, desc)
        )
        project_id = cur.fetchone()[0]

        # Link categories
        for cat_slug in p_cats:
            cur.execute(
                "INSERT INTO project_categories (project_id, category_slug) VALUES (%s, %s)",
                (project_id, cat_slug)
            )

        # Download a random placeholder image from Unsplash
        # Using specific keywords to get nice UI/Design placeholders
        try:
            img_data = download_image(f'https://source.unsplash.com/random/800x600/?design,art,minimal,{p_cats[0]}')
        except:
            # Fallback if unsplash source is down
            img_data = download_image('https://picsum.photos/800/600')

        # Insert Cover Image
        cur.execute(
            "INSERT INTO project_images (project_id, image_data, image_mime, is_cover) VALUES (%s, %s, %s, %s)",
            (project_id, psycopg2.Binary(img_data), 'image/jpeg', True)
        )
        
        # Insert 1-2 extra gallery images
        for _ in range(random.randint(1, 2)):
            try:
                gallery_img = download_image('https://picsum.photos/800/600')
                cur.execute(
                    "INSERT INTO project_images (project_id, image_data, image_mime, is_cover) VALUES (%s, %s, %s, %s)",
                    (project_id, psycopg2.Binary(gallery_img), 'image/jpeg', False)
                )
            except:
                pass
        
        print(f" * Inserted Project: {title}")

    # Contact is already handled by schema.py, so we leave it.
    
    conn.commit()
    cur.close()
    conn.close()
    print("Done! Database successfully seeded.")

if __name__ == '__main__':
    seed_db()
