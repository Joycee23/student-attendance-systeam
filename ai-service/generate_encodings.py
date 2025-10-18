import os
import cv2
import pickle
import face_recognition
import numpy as np

# ===============================
# CẤU HÌNH THƯ MỤC
# ===============================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
ENCODINGS_DIR = os.path.join(DATA_DIR, 'encodings')
IMAGES_DIR = os.path.join(DATA_DIR, 'images')

os.makedirs(ENCODINGS_DIR, exist_ok=True)

# ===============================
# TẠO ENCODING CHO TỪNG SINH VIÊN
# ===============================
for student_folder in os.listdir(IMAGES_DIR):
    student_path = os.path.join(IMAGES_DIR, student_folder)
    if not os.path.isdir(student_path):
        continue

    print(f"📸 Processing {student_folder} ...")
    encodings = []

    for img_name in os.listdir(student_path):
        if not img_name.lower().endswith(('.jpg', '.jpeg', '.png')):
            continue

        img_path = os.path.join(student_path, img_name)
        image_bgr = cv2.imread(img_path)

        if image_bgr is None:
            print(f"⚠️ Cannot read {img_name}, skipping...")
            continue

        # Ép ảnh sang RGB 8-bit chuẩn
        image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        image_rgb = np.ascontiguousarray(image_rgb, dtype=np.uint8)

        try:
            face_locations = face_recognition.face_locations(image_rgb)
        except Exception as e:
            print(f"⚠️ Error processing {img_name}: {e}")
            continue

        if len(face_locations) == 0:
            print(f"⚠️ No face found in {img_name}, skipping...")
            continue

        face_encoding = face_recognition.face_encodings(image_rgb, face_locations)[0]
        encodings.append(face_encoding)

    if encodings:
        output_path = os.path.join(ENCODINGS_DIR, f"{student_folder}.pkl")
        with open(output_path, 'wb') as f:
            pickle.dump({"encodings": encodings}, f)
        print(f"✅ Saved encoding for {student_folder}: {len(encodings)} images")
    else:
        print(f"❌ No valid encodings for {student_folder}")

print("🎯 DONE! All encodings generated successfully.")
