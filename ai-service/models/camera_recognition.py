# # import cv2
# # import face_recognition
# # import os

# # # === Đường dẫn thư mục chứa hình ảnh mẫu khuôn mặt đã biết ===
# # KNOWN_FACES_DIR = "data/encodings"  # hoặc thư mục chứa ảnh khuôn mặt của bạn

# # # === Load các khuôn mặt đã biết (nếu có) ===
# # known_faces = []
# # known_names = []

# # print("🔍 Loading known faces...")

# # for name in os.listdir(KNOWN_FACES_DIR):
# #     for filename in os.listdir(f"{KNOWN_FACES_DIR}/{name}"):
# #         image = face_recognition.load_image_file(f"{KNOWN_FACES_DIR}/{name}/{filename}")
# #         encoding = face_recognition.face_encodings(image)[0]
# #         known_faces.append(encoding)
# #         known_names.append(name)

# # print(f"✅ Loaded {len(known_faces)} known faces.")

# # # === Mở camera (0 là webcam mặc định) ===
# # video_capture = cv2.VideoCapture(0)

# # print("🎥 Starting camera... (Press 'q' to quit)")

# # while True:
# #     ret, frame = video_capture.read()
# #     if not ret:
# #         print("⚠️ Cannot access camera.")
# #         break

# #     # Thu nhỏ ảnh để xử lý nhanh hơn
# #     small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
# #     rgb_small_frame = small_frame[:, :, ::-1]

# #     # Nhận diện khuôn mặt
# #     face_locations = face_recognition.face_locations(rgb_small_frame)
# #     face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)

# #     for (top, right, bottom, left), face_encoding in zip(face_locations, face_encodings):
# #         matches = face_recognition.compare_faces(known_faces, face_encoding)
# #         name = "Unknown"

# #         if True in matches:
# #             first_match_index = matches.index(True)
# #             name = known_names[first_match_index]

# #         # Phóng to lại vị trí khuôn mặt theo tỷ lệ 4x
# #         top *= 4
# #         right *= 4
# #         bottom *= 4
# #         left *= 4

# #         # Vẽ khung + tên
# #         cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)
# #         cv2.rectangle(frame, (left, bottom - 35), (right, bottom), (0, 255, 0), cv2.FILLED)
# #         cv2.putText(frame, name, (left + 6, bottom - 6), cv2.FONT_HERSHEY_DUPLEX, 0.9, (0, 0, 0), 1)

# #     cv2.imshow("Face Recognition Camera", frame)

# #     # Nhấn phím 'q' để thoát
# #     if cv2.waitKey(1) & 0xFF == ord('q'):
# #         break

# # video_capture.release()
# # cv2.destroyAllWindows()
# # print("👋 Camera stopped.")

# import cv2
# import face_recognition
# import os
# import numpy as np

# KNOWN_FACES_DIR = "data/encodings"

# known_faces = []
# known_names = []

# print("🔍 Loading encodings from:", KNOWN_FACES_DIR)

# for file in os.listdir(KNOWN_FACES_DIR):
#     if file.endswith(".pkl") or file.endswith(".jpg") or file.endswith(".png"):
#         try:
#             path = os.path.join(KNOWN_FACES_DIR, file)
#             image = face_recognition.load_image_file(path)
#             encodings = face_recognition.face_encodings(image)

#             if len(encodings) > 0:
#                 encoding = encodings[0]
#                 name = os.path.splitext(file)[0]
#                 known_faces.append(encoding)
#                 known_names.append(name)
#                 print(f"✅ Loaded: {name}")
#             else:
#                 print(f"⚠️ Không tìm thấy mặt trong file: {file}")
#         except Exception as e:
#             print(f"❌ Lỗi khi xử lý file {file}: {e}")

# print(f"\n✅ Tổng cộng {len(known_faces)} khuôn mặt đã load.\n")

# video_capture = cv2.VideoCapture(0)

# process_frame = True  # xử lý mỗi frame cách 1 frame

# print("🎥 Camera started — bấm Q để thoát")

# while True:
#     ret, frame = video_capture.read()
#     if not ret:
#         print("⚠️ Camera không truy cập được")
#         break

#     small_frame = cv2.resize(frame, (0,0), fx=0.25, fy=0.25)
#     rgb_small_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)

#     if process_frame:
#         face_locations = face_recognition.face_locations(rgb_small_frame, model="cnn")
#         face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)

#         names = []
#         for face_encoding in face_encodings:
#             distances = face_recognition.face_distance(known_faces, face_encoding)
#             best_match = np.argmin(distances)

#             if distances[best_match] < 0.45:  # tăng độ chính xác
#                 names.append(known_names[best_match])
#             else:
#                 names.append("Unknown")

#     process_frame = not process_frame

#     for (top, right, bottom, left), name in zip(face_locations, names):
#         top *= 4; right *= 4; bottom *= 4; left *= 4

#         color = (0,255,0) if name != "Unknown" else (0,0,255)

#         cv2.rectangle(frame, (left, top), (right, bottom), color, 2)
#         cv2.putText(frame, name, (left, top - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

#     cv2.imshow("📌 Enhanced Face Recognition", frame)

#     if cv2.waitKey(1) & 0xFF == ord('q'):
#         break

# video_capture.release()
# cv2.destroyAllWindows()
# print("👋 Camera stopped.")
import os
import cv2
import pickle
import face_recognition
import numpy as np
import csv
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "../data")
ENCODINGS_DIR = os.path.join(DATA_DIR, "encodings")
ATTENDANCE_FILE = os.path.join(DATA_DIR, "attendance_logs.csv")

# ====== Initialize CSV if not exists ======
if not os.path.exists(ATTENDANCE_FILE):
    with open(ATTENDANCE_FILE, mode="w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["timestamp", "name", "status"])
    print("📄 Created attendance_logs.csv")

# Track students already logged
logged_students = set()

# ====== Load encodings ======
known_encodings = []
known_names = []

print("🔍 Loading encodings...")
for file in os.listdir(ENCODINGS_DIR):
    if file.endswith(".pkl"):
        data = pickle.load(open(os.path.join(ENCODINGS_DIR, file), "rb"))
        student_name = file.replace(".pkl", "")
        for enc in data["encodings"]:
            known_encodings.append(enc)
            known_names.append(student_name)

print(f"✅ Loaded {len(known_encodings)} encodings!")

# ====== Webcam start ======
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("❌ Webcam not detected!")
    exit()

print("🎥 Camera ready! Press 'q' to stop")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    locations = face_recognition.face_locations(rgb_frame)
    encodings = face_recognition.face_encodings(rgb_frame, locations)

    for (top, right, bottom, left), face_enc in zip(locations, encodings):
        matches = face_recognition.compare_faces(known_encodings, face_enc, tolerance=0.48)
        name = "Unknown"

        if True in matches:
            idxs = np.where(matches)[0]
            counts = {}
            for i in idxs:
                counts[known_names[i]] = counts.get(known_names[i], 0) + 1
            name = max(counts, key=counts.get)

        # Draw box
        color = (0, 255, 0) if name != "Unknown" else (0, 0, 255)
        cv2.rectangle(frame, (left, top), (right, bottom), color, 2)
        cv2.putText(frame, name, (left, top - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)

        # Log attendance once
        if name != "Unknown" and name not in logged_students:
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            with open(ATTENDANCE_FILE, mode="a", newline="") as f:
                writer = csv.writer(f)
                writer.writerow([timestamp, name, "Present"])
            
            logged_students.add(name)
            print(f"✅ Attendance logged: {name} at {timestamp}")

    cv2.imshow("🎯 Face Recognition / Q = Quit", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
print("✅ Camera stopped!")
