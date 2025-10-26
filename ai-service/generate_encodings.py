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
import os
import cv2
import pickle
import face_recognition
import numpy as np

# ====== Đường dẫn ======
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "../data")
# Đường dẫn tuyệt đối
IMAGES_DIR = r"D:\monthu2\student-attendance-systeam\data\images_fixed"
ENCODINGS_DIR = os.path.join(DATA_DIR, "encodings")

print(os.path.exists(IMAGES_DIR))
os.makedirs(ENCODINGS_DIR, exist_ok=True)

# ====== Duyệt từng thư mục sinh viên ======
for student_folder in os.listdir(IMAGES_DIR):
    student_path = os.path.join(IMAGES_DIR, student_folder)
    if not os.path.isdir(student_path):
        continue

    print(f"\n📸 Processing {student_folder}...")

    encodings = []

    # Thông tin cơ bản: student_id lấy theo tên folder (hoặc tùy chỉnh)
    student_id = student_folder
    student_name = student_folder
    student_class = "Unknown"

    # ====== Duyệt từng ảnh trong folder ======
    for img_file in os.listdir(student_path):
        img_path = os.path.join(student_path, img_file)
        if not img_file.lower().endswith((".jpg", ".jpeg", ".png")):
            continue

        # Load ảnh và chuyển sang RGB 8-bit
        image = cv2.imread(img_path)
        if image is None:
            print(f"⚠️ Cannot read {img_file}, skipping...")
            continue

        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        rgb_image = rgb_image.astype(np.uint8)

        # Tìm khuôn mặt
        face_locations = face_recognition.face_locations(rgb_image, model="hog")
        if len(face_locations) == 0:
            print(f"⚠️ No face found in {img_file}, skipping...")
            continue

        # Lấy encoding
        face_encs = face_recognition.face_encodings(rgb_image, face_locations)
        encodings.extend(face_encs)

    if len(encodings) == 0:
        print(f"⚠️ No valid encodings for {student_folder}, skipping saving.")
        continue

    # Tạo dữ liệu chuẩn cho webcam
    data = {
        "encodings": encodings,
        "info": {
            "student_id": student_id,
            "name": student_name,
            "class": student_class
        }
    }

    # Lưu file .pkl cho mỗi sinh viên
    file_path = os.path.join(ENCODINGS_DIR, f"{student_id}.pkl")
    with open(file_path, "wb") as f:
        pickle.dump(data, f)

    print(f"✅ Saved {len(encodings)} encodings for {student_name} ({student_id})")
