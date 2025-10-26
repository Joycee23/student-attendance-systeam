# # import os
# # import cv2

# # base_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "images")

# # for folder in os.listdir(base_dir):
# #     folder_path = os.path.join(base_dir, folder)
# #     if not os.path.isdir(folder_path):
# #         continue

# #     for img_name in os.listdir(folder_path):
# #         if not img_name.lower().endswith((".jpg", ".jpeg", ".png")):
# #             continue

# #         img_path = os.path.join(folder_path, img_name)
# #         img = cv2.imread(img_path, cv2.IMREAD_COLOR)  # ép đọc RGB 8bit
# #         if img is None:
# #             print(f"⚠️ Không đọc được ảnh {img_name}")
# #             continue

# #         cv2.imwrite(img_path, img, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
# #         print(f"✅ Đã sửa {img_path} → RGB 8-bit hợp lệ")

# # print("🎯 Tất cả ảnh đã được xử lý xong!")
# import os
# import cv2

# DATA_DIR = os.path.join(os.path.dirname(__file__), 'data', 'images')
# OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'data', 'images_fixed')
# os.makedirs(OUTPUT_DIR, exist_ok=True)

# for student in os.listdir(DATA_DIR):
#     input_path = os.path.join(DATA_DIR, student)
#     output_path = os.path.join(OUTPUT_DIR, student)
#     os.makedirs(output_path, exist_ok=True)

#     if not os.path.isdir(input_path):
#         continue

#     for img_file in os.listdir(input_path):
#         img_path = os.path.join(input_path, img_file)
#         img = cv2.imread(img_path)
#         if img is None:
#             print(f"❌ Error reading {img_path}")
#             continue

#         rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
#         save_path = os.path.join(output_path, img_file)
#         cv2.imwrite(save_path, cv2.cvtColor(rgb_img, cv2.COLOR_RGB2BGR))
#         print(f"✅ Fixed {student}/{img_file}")

# print("🎯 DONE fixing all images!")
import os
from PIL import Image

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data', 'images')
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'data', 'images_fixed')
os.makedirs(OUTPUT_DIR, exist_ok=True)

for student in os.listdir(DATA_DIR):
    input_path = os.path.join(DATA_DIR, student)
    output_path = os.path.join(OUTPUT_DIR, student)
    os.makedirs(output_path, exist_ok=True)

    if not os.path.isdir(input_path):
        continue

    for img_file in os.listdir(input_path):
        img_path = os.path.join(input_path, img_file)

        try:
            img = Image.open(img_path)

            # Force convert to 8-bit RGB ✅
            img = img.convert("RGB")

            save_path = os.path.join(output_path, img_file)
            img.save(save_path, optimize=True)

            print(f"✅ Fixed RGB: {student}/{img_file}")

        except Exception as e:
            print(f"❌ Error {img_file}: {e}")

print("🎯 ALL IMAGES FIXED TO RGB 8-bit")
