# # # import os
# # # import cv2
# # # import pickle
# # # import face_recognition
# # # import numpy as np

# # # # ===============================
# # # # CẤU HÌNH THƯ MỤC
# # # # ===============================
# # # BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# # # DATA_DIR = os.path.join(BASE_DIR, 'data')
# # # ENCODINGS_DIR = os.path.join(DATA_DIR, 'encodings')
# # # IMAGES_DIR = os.path.join(DATA_DIR, 'images')

# # # os.makedirs(ENCODINGS_DIR, exist_ok=True)

# # # # ===============================
# # # # TẠO ENCODING CHO TỪNG SINH VIÊN
# # # # ===============================
# # # for student_folder in os.listdir(IMAGES_DIR):
# # #     student_path = os.path.join(IMAGES_DIR, student_folder)
# # #     if not os.path.isdir(student_path):
# # #         continue

# # #     print(f"📸 Processing {student_folder} ...")
# # #     encodings = []

# # #     for img_name in os.listdir(student_path):
# # #         if not img_name.lower().endswith(('.jpg', '.jpeg', '.png')):
# # #             continue

# # #         img_path = os.path.join(student_path, img_name)
# # #         image_bgr = cv2.imread(img_path)

# # #         if image_bgr is None:
# # #             print(f"⚠️ Cannot read {img_name}, skipping...")
# # #             continue

# # #         # Ép ảnh sang RGB 8-bit chuẩn
# # #         image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
# # #         image_rgb = np.ascontiguousarray(image_rgb, dtype=np.uint8)

# # #         try:
# # #             face_locations = face_recognition.face_locations(image_rgb)
# # #         except Exception as e:
# # #             print(f"⚠️ Error processing {img_name}: {e}")
# # #             continue

# # #         if len(face_locations) == 0:
# # #             print(f"⚠️ No face found in {img_name}, skipping...")
# # #             continue

# # #         face_encoding = face_recognition.face_encodings(image_rgb, face_locations)[0]
# # #         encodings.append(face_encoding)

# # #     if encodings:
# # #         output_path = os.path.join(ENCODINGS_DIR, f"{student_folder}.pkl")
# # #         with open(output_path, 'wb') as f:
# # #             pickle.dump({"encodings": encodings}, f)
# # #         print(f"✅ Saved encoding for {student_folder}: {len(encodings)} images")
# # #     else:
# # #         print(f"❌ No valid encodings for {student_folder}")

# # # print("🎯 DONE! All encodings generated successfully.")
# # import os
# # import cv2
# # import pickle
# # import face_recognition

# # BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# # IMAGES_DIR = os.path.join(BASE_DIR, 'data', 'images_fixed')  # dùng ảnh đã fix
# # ENCODINGS_DIR = os.path.join(BASE_DIR, 'data', 'encodings')
# # os.makedirs(ENCODINGS_DIR, exist_ok=True)

# # for student in os.listdir(IMAGES_DIR):
# #     student_path = os.path.join(IMAGES_DIR, student)
# #     if not os.path.isdir(student_path):
# #         continue

# #     print(f"📸 Processing {student} ...")
# #     encodings = []

# #     for img_name in os.listdir(student_path):
# #         if not img_name.lower().endswith(('.jpg', '.jpeg', '.png')):
# #             continue

# #         img_path = os.path.join(student_path, img_name)
# #         image = face_recognition.load_image_file(img_path)
# #         image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

# #         locations = face_recognition.face_locations(image)
# #         if len(locations) == 0:
# #             print(f"⚠️ No face found in {img_name}")
# #             continue

# #         encoding = face_recognition.face_encodings(image, locations)[0]
# #         encodings.append(encoding)

# #     if encodings:
# #         out_path = os.path.join(ENCODINGS_DIR, f"{student}.pkl")
# #         with open(out_path, 'wb') as f:
# #             pickle.dump({"encodings": encodings}, f)
# #         print(f"✅ Saved {len(encodings)} encodings for {student}")
# #     else:
# #         print(f"❌ No encodings for {student}")

# # print("🎯 DONE! Encodings generated successfully.")
# import os
# import cv2
# import pickle
# import face_recognition
# import numpy as np

# # ===============================
# # CẤU HÌNH THƯ MỤC
# # ===============================
# BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# DATA_DIR = os.path.join(BASE_DIR, 'data')
# IMAGES_DIR = os.path.join(DATA_DIR, 'images_fixed')   # ✅ dùng ảnh đã fix
# ENCODINGS_DIR = os.path.join(DATA_DIR, 'encodings')

# os.makedirs(ENCODINGS_DIR, exist_ok=True)

# # ===============================
# # TẠO ENCODING CHO TỪNG SINH VIÊN
# # ===============================
# for student_folder in os.listdir(IMAGES_DIR):
#     student_path = os.path.join(IMAGES_DIR, student_folder)
#     if not os.path.isdir(student_path):
#         continue

#     print(f"📸 Processing {student_folder} ...")
#     encodings = []

#     for img_name in os.listdir(student_path):
#         if not img_name.lower().endswith(('.jpg', '.jpeg', '.png')):
#             continue

#         img_path = os.path.join(student_path, img_name)
#         image = cv2.imread(img_path, cv2.IMREAD_UNCHANGED)

#         if image is None:
#             print(f"⚠️ Cannot read {img_name}")
#             continue

#         # Convert về RGB đúng chuẩn
#         if image.ndim == 2:
#             image = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
#         elif image.shape[2] == 4:
#             image = cv2.cvtColor(image, cv2.COLOR_BGRA2RGB)
#         else:
#             image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

#         # Phát hiện khuôn mặt
#         face_locations = face_recognition.face_locations(image)
#         if len(face_locations) == 0:
#             print(f"⚠️ No face found in {img_name}, skipping...")
#             continue

#         # Tạo encoding
#         face_encoding = face_recognition.face_encodings(image, face_locations)[0]
#         encodings.append(face_encoding)

#     if encodings:
#         # Lưu encoding ra file .pkl
#         output_path = os.path.join(ENCODINGS_DIR, f"{student_folder}.pkl")
#         with open(output_path, 'wb') as f:
#             pickle.dump({"encodings": encodings}, f)

#         print(f"✅ Saved encoding for {student_folder}: {len(encodings)} images")
#     else:
#         print(f"❌ No valid encodings for {student_folder}")

# print("🎯 DONE! All encodings generated successfully.")
# import os
# import cv2
# import pickle
# import face_recognition
# import numpy as np

# # ====== Thư mục cơ bản ======
# BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# DATA_DIR = os.path.join(BASE_DIR, "../data")
# IMAGES_DIR = os.path.join(DATA_DIR, "images_fixed")
# ENCODINGS_DIR = os.path.join(DATA_DIR, "encodings")

# # Tạo folder nếu chưa có
# os.makedirs(IMAGES_DIR, exist_ok=True)
# os.makedirs(ENCODINGS_DIR, exist_ok=True)

# # Kiểm tra folder images_fixed
# if not os.listdir(IMAGES_DIR):
#     print(f"⚠️ Folder {IMAGES_DIR} đang trống. Vui lòng thêm ảnh sinh viên trước khi chạy.")
#     exit()

# print(f"🔍 Scanning images from: {IMAGES_DIR}")

# # ====== Duyệt từng thư mục sinh viên ======
# for student_folder in os.listdir(IMAGES_DIR):
#     student_path = os.path.join(IMAGES_DIR, student_folder)
#     if not os.path.isdir(student_path):
#         continue

#     print(f"\n📸 Processing {student_folder}...")

#     encodings = []

#     # Tên sinh viên và ID lấy theo folder
#     student_id = student_folder
#     student_name = student_folder
#     student_class = "Unknown"

#     for img_file in os.listdir(student_path):
#         img_path = os.path.join(student_path, img_file)
#         if not img_file.lower().endswith((".jpg", ".jpeg", ".png")):
#             continue

#         # Load ảnh và chuyển sang RGB 8-bit
#         image = cv2.imread(img_path)
#         if image is None:
#             print(f"⚠️ Cannot read {img_file}, skipping...")
#             continue

#         rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
#         rgb_image = rgb_image.astype(np.uint8)

#         # Tìm khuôn mặt
#         face_locations = face_recognition.face_locations(rgb_image, model="hog")
#         if len(face_locations) == 0:
#             print(f"⚠️ No face found in {img_file}, skipping...")
#             continue

#         # Lấy encoding
#         face_encs = face_recognition.face_encodings(rgb_image, face_locations)
#         encodings.extend(face_encs)
        
    
#     if len(encodings) == 0:
#         print(f"⚠️ No valid encodings for {student_folder}, skipping saving.")
#         continue

#     # Tạo dữ liệu chuẩn cho webcam/Flask
#     data = {
#         "encodings": encodings,
#         "info": {
#             "student_id": student_id,
#             "name": student_name,
#             "class": student_class
#         }
#     }

#     # Lưu file .pkl
#     file_path = os.path.join(ENCODINGS_DIR, f"{student_id}.pkl")
#     with open(file_path, "wb") as f:
#         pickle.dump(data, f)

#     print(f"✅ Saved {len(encodings)} encodings for {student_name} ({student_id})")

# print("\n🎯 Tất cả sinh viên đã được tạo encoding thành công!")

import os
import cv2
import pickle
import face_recognition
import numpy as np
import shutil

# ====== Folder ======
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "../data")
RAW_DIR = os.path.join(DATA_DIR, "images_raw")      # ảnh gốc
FIXED_DIR = os.path.join(DATA_DIR, "images_fixed")  # folder con cho từng sinh viên
ENCODINGS_DIR = os.path.join(DATA_DIR, "encodings") # lưu .pkl

# Tạo folder nếu chưa có
os.makedirs(RAW_DIR, exist_ok=True)
os.makedirs(FIXED_DIR, exist_ok=True)
os.makedirs(ENCODINGS_DIR, exist_ok=True)

# Kiểm tra ảnh raw
raw_files = [f for f in os.listdir(RAW_DIR) if f.lower().endswith((".jpg",".jpeg",".png"))]
if not raw_files:
    print(f"⚠️ Folder {RAW_DIR} đang trống. Hãy bỏ ảnh sinh viên vào.")
    exit()

print(f"🔍 Tìm thấy {len(raw_files)} ảnh trong {RAW_DIR}")

# ====== Chuẩn bị folder con và copy ảnh ======
for file in raw_files:
    file_path = os.path.join(RAW_DIR, file)
    # ID/Tên từ file: 12345_TranThiB.jpg
    name_part = os.path.splitext(file)[0]
    student_folder = os.path.join(FIXED_DIR, name_part)
    os.makedirs(student_folder, exist_ok=True)
    dst = os.path.join(student_folder, file)
    shutil.copy2(file_path, dst)
    print(f"✅ Đã chuẩn bị ảnh cho {name_part}")

# ====== Tạo encoding ======
for student_folder_name in os.listdir(FIXED_DIR):
    student_folder = os.path.join(FIXED_DIR, student_folder_name)
    if not os.path.isdir(student_folder):
        continue

    encodings = []
    for img_file in os.listdir(student_folder):
        img_path = os.path.join(student_folder, img_file)
        image = cv2.imread(img_path)
        if image is None:
            print(f"⚠️ Không đọc được {img_file}, bỏ qua.")
            continue

        # Chuyển sang RGB 8-bit
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        rgb_image = rgb_image.astype(np.uint8)

        # Dò khuôn mặt
        face_locations = face_recognition.face_locations(rgb_image, model="hog")
        if len(face_locations) == 0:
            print(f"⚠️ Không tìm thấy khuôn mặt trong {img_file}, bỏ qua.")
            continue

        # Tạo encoding
        face_encs = face_recognition.face_encodings(rgb_image, face_locations)
        encodings.extend(face_encs)

    if len(encodings) == 0:
        print(f"⚠️ Không tạo được encoding cho {student_folder_name}, bỏ qua.")
        continue

    # Tạo dữ liệu chuẩn cho Flask/Webcam
    data = {
        "encodings": encodings,
        "info": {
            "student_id": student_folder_name,
            "name": student_folder_name,
            "class": "Unknown"
        }
    }

    # Lưu file .pkl
    file_path = os.path.join(ENCODINGS_DIR, f"{student_folder_name}.pkl")
    with open(file_path, "wb") as f:
        pickle.dump(data, f)

    print(f"✅ Đã lưu encoding cho {student_folder_name}")

print("\n🎯 Hoàn tất tất cả sinh viên!")
