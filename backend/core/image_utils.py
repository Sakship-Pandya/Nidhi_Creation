import io
from PIL import Image

def process_image(image_bytes: bytes, max_width: int = 1200, quality: int = 85) -> tuple[bytes, str]:
    """
    Resizes the image if it's wider than max_width and compresses it.
    Returns (processed_bytes, mime_type).
    """
    img = Image.open(io.BytesIO(image_bytes))
    
    # Convert to RGB if necessary (e.g., for RGBA or CMYK)
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
    elif img.mode == "CMYK":
        img = img.convert("RGB")

    # Resize if wider than max_width
    width, height = img.size
    if width > max_width:
        new_height = int((max_width / width) * height)
        img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)

    # Save to buffer
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG", quality=quality, optimize=True)
    return buffer.getvalue(), "image/jpeg"
