import cv2
import numpy as np

img_path = r"c:\Users\Obra 369\Desktop\Projeto Usina\app\static\logo.png"
img = cv2.imread(img_path, cv2.IMREAD_UNCHANGED)

if img is None:
    print("Could not read image")
    exit()

# If image has alpha, blend it with white
if img.shape[2] == 4:
    alpha_channel = img[:,:,3]
    rgb_channels = img[:,:,:3]
    white_background = np.ones_like(rgb_channels, dtype=np.uint8) * 255
    alpha_factor = alpha_channel[:,:,np.newaxis] / 255.0
    alpha_factor = alpha_factor.astype(np.float32)
    img_rgb = rgb_channels.astype(np.float32) * alpha_factor + white_background.astype(np.float32) * (1 - alpha_factor)
    img_rgb = img_rgb.astype(np.uint8)
else:
    img_rgb = img

# Convert to grayscale
gray = cv2.cvtColor(img_rgb, cv2.COLOR_BGR2GRAY)
# Anything not 255 (white) is content. We tolerate near-white (e.g. up to 240)
_, thresh = cv2.threshold(gray, 245, 255, cv2.THRESH_BINARY_INV)

# Find all non-zero points (i.e. not white)
points = cv2.findNonZero(thresh)
if points is not None:
    x, y, w, h = cv2.boundingRect(points)
    print(f"Bounding rect of actual logo content: x={x}, y={y}, w={w}, h={h}")
    cropped = img_rgb[y:y+h, x:x+w]
    cv2.imwrite(r"c:\Users\Obra 369\Desktop\Projeto Usina\app\static\logo_cropped_cv.png", cropped)
    print("Saved aggressive crop to logo_cropped_cv.png")
else:
    print("Image seems to be empty or completely white.")
