from PIL import Image

def trim_aggressive(im):
    # Convert image to RGB
    im_rgb = im.convert("RGB")
    
    # We want to find the bounding box of pixels that are NOT clearly white.
    # We'll build a mask.
    width, height = im_rgb.size
    pixels = im_rgb.load()
    
    # Find min_x, max_x, min_y, max_y
    min_x = width
    min_y = height
    max_x = -1
    max_y = -1
    
    for y in range(height):
        for x in range(width):
            r, g, b = pixels[x, y]
            # Tolerate slightly off-white (e.g. up to 240)
            if r < 240 or g < 240 or b < 240:
                if x < min_x: min_x = x
                if x > max_x: max_x = x
                if y < min_y: min_y = y
                if y > max_y: max_y = y
                
    if max_x >= min_x and max_y >= min_y:
        return im.crop((min_x, min_y, max_x + 1, max_y + 1))
    return im

try:
    img_path = r"c:\Users\Obra 369\Desktop\Projeto Usina\app\static\logo.png"
    print(f"Processing {img_path} with aggressive white-trimming...")
    img = Image.open(img_path)
    # If the image has an alpha channel, we might also want to composite it against white first
    # to avoid issues with transparent pixels being seen as black/random.
    if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
        bg = Image.new("RGB", img.size, (255, 255, 255))
        bg.paste(img, mask=img.convert('RGBA').split()[3]) # 3 is the alpha channel
        img_for_calc = bg
    else:
        img_for_calc = img
        
    original_size = img.size
    cropped = trim_aggressive(img_for_calc)
    
    # But we want to crop the ORIGINAL image, not the white-background one
    # Let's extract exactly the same bounding box:
    # We need to run the logic again but just return the bbox array.
    
    def get_bbox(im_rgb):
        width, height = im_rgb.size
        pixels = im_rgb.load()
        min_x = width
        min_y = height
        max_x = -1
        max_y = -1
        for y in range(height):
            for x in range(width):
                r, g, b = pixels[x, y]
                if r < 240 or g < 240 or b < 240:
                    if x < min_x: min_x = x
                    if x > max_x: max_x = x
                    if y < min_y: min_y = y
                    if y > max_y: max_y = y
        if max_x >= min_x and max_y >= min_y:
            return (min_x, min_y, max_x + 1, max_y + 1)
        return None
        
    bbox = get_bbox(img_for_calc)
    if bbox:
        final_cropped = img.crop(bbox)
        final_cropped.save(img_path)
        print(f"Logo cropped successfully! Original size: {original_size}, New size: {final_cropped.size}")
    else:
        print("Image is entirely white/empty.")
except Exception as e:
    import traceback
    traceback.print_exc()
