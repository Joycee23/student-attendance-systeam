import os
import cv2

base_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "images")

for folder in os.listdir(base_dir):
    folder_path = os.path.join(base_dir, folder)
    if not os.path.isdir(folder_path):
        continue

    for img_name in os.listdir(folder_path):
        if not img_name.lower().endswith((".jpg", ".jpeg", ".png")):
            continue

        img_path = os.path.join(folder_path, img_name)
        img = cv2.imread(img_path, cv2.IMREAD_COLOR)  # ép đọc RGB 8bit
        if img is None:
            print(f"⚠️ Không đọc được ảnh {img_name}")
            continue

        cv2.imwrite(img_path, img, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
        print(f"✅ Đã sửa {img_path} → RGB 8-bit hợp lệ")

print("🎯 Tất cả ảnh đã được xử lý xong!")
