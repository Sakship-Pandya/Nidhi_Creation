import io
from PIL import Image
try:
    import pillow_avif
except ImportError:
    pass

def process_image_variants(image_bytes: bytes) -> list[dict]:
    """
    Generates multiple sizes and formats (AVIF, WebP, JPEG fallback).
    Returns a list of dicts: [{'size': 'small', 'format': 'avif', 'data': b'...', 'mime': 'image/avif'}, ...]
    """
    img = Image.open(io.BytesIO(image_bytes))
    
    # Convert to RGB if necessary
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
    elif img.mode == "CMYK":
        img = img.convert("RGB")

    orig_width, orig_height = img.size
    
    # Define sizes and formats
    # Small: 400px, Medium: 800px, Large: 1200px
    sizes = {
        'small': 400,
        'medium': 800,
        'large': 1200
    }
    formats = [
        {'ext': 'AVIF', 'mime': 'image/avif', 'quality': 50, 'speed': 5},
        {'ext': 'WEBP', 'mime': 'image/webp', 'quality': 60, 'method': 5},
        {'ext': 'JPEG', 'mime': 'image/jpeg', 'quality': 70, 'optimize': True}
    ]

    variants = []

    # Original size (converted to modern formats)
    for fmt in formats:
        buffer = io.BytesIO()
        save_params = {'quality': fmt['quality']}
        if fmt['ext'] == 'AVIF':
            save_params['speed'] = fmt['speed']
        elif fmt['ext'] == 'WEBP':
            save_params['method'] = fmt['method']
        elif fmt['ext'] == 'JPEG':
            save_params['optimize'] = True
            
        img.save(buffer, format=fmt['ext'], **save_params)
        variants.append({
            'size': 'original',
            'format': fmt['ext'].lower(),
            'data': buffer.getvalue(),
            'mime': fmt['mime'],
            'width': orig_width,
            'height': orig_height
        })

    # Resized versions
    for size_label, target_width in sizes.items():
        if orig_width <= target_width:
            continue # Skip if original is smaller than target
            
        target_height = int((target_width / orig_width) * orig_height)
        resized_img = img.resize((target_width, target_height), Image.Resampling.LANCZOS)
        
        for fmt in formats:
            buffer = io.BytesIO()
            save_params = {'quality': fmt['quality']}
            if fmt['ext'] == 'AVIF':
                save_params['speed'] = fmt['speed']
            elif fmt['ext'] == 'WEBP':
                save_params['method'] = fmt['method']
            elif fmt['ext'] == 'JPEG':
                save_params['optimize'] = True
                
            resized_img.save(buffer, format=fmt['ext'], **save_params)
            variants.append({
                'size': size_label,
                'format': fmt['ext'].lower(),
                'data': buffer.getvalue(),
                'mime': fmt['mime'],
                'width': target_width,
                'height': target_height
            })
            
    return variants
