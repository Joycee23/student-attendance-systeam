# import os
# import cv2
# import pickle
# import face_recognition
# import numpy as np
# import csv
# from datetime import datetime

# # ====== Cấu hình thư mục ======
# BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# DATA_DIR = os.path.join(BASE_DIR, "../data")
# ENCODINGS_DIR = os.path.join(DATA_DIR, "encodings")
# ATTENDANCE_FILE = os.path.join(DATA_DIR, "attendance_logs.csv")

# # ====== Tạo CSV nếu chưa có ======
# if not os.path.exists(ATTENDANCE_FILE):
#     with open(ATTENDANCE_FILE, mode="w", newline="") as f:
#         writer = csv.writer(f)
#         writer.writerow(["date", "time", "name", "status"])
#     print("📄 Created attendance_logs.csv")

# # ====== Load danh sách đã điểm danh hôm nay ======
# today = datetime.now().strftime("%Y-%m-%d")
# logged_today = set()

# if os.path.exists(ATTENDANCE_FILE):
#     with open(ATTENDANCE_FILE, mode="r") as f:
#         reader = csv.reader(f)
#         next(reader, None)  # skip header
#         for row in reader:
#             if row[0] == today:
#                 logged_today.add(row[2])

# # ====== Load encodings ======
# known_encodings = []
# known_names = []

# print("🔍 Loading encodings...")
# for file in os.listdir(ENCODINGS_DIR):
#     if file.endswith(".pkl"):
#         data = pickle.load(open(os.path.join(ENCODINGS_DIR, file), "rb"))
#         student_name = data["name"]
#         for enc in data["encodings"]:
#             known_encodings.append(enc)
#             known_names.append(student_name)

# print(f"✅ Loaded {len(known_encodings)} encodings!")

# # ====== Mở webcam ======
# cap = cv2.VideoCapture(0)
# if not cap.isOpened():
#     print("❌ Webcam not detected!")
#     exit()

# print("🎥 Camera started — Press 'q' to quit")

# while True:
#     ret, frame = cap.read()
#     if not ret:
#         break

#     # Chuyển sang RGB 8-bit
#     rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
#     rgb_frame = rgb_frame.astype(np.uint8)

#     # Tìm khuôn mặt và encoding
#     locations = face_recognition.face_locations(rgb_frame, model="hog")
#     encodings = face_recognition.face_encodings(rgb_frame, locations)

#     for (top, right, bottom, left), face_enc in zip(locations, encodings):
#         matches = face_recognition.compare_faces(known_encodings, face_enc, tolerance=0.48)
#         name = "Unknown"

#         if True in matches:
#             matchedIdxs = np.where(matches)[0]
#             name_counts = {}
#             for i in matchedIdxs:
#                 name_counts[known_names[i]] = name_counts.get(known_names[i], 0) + 1
#             name = max(name_counts, key=name_counts.get)

#         # Vẽ khung mặt và tên
#         color = (0, 255, 0) if name != "Unknown" else (0, 0, 255)
#         cv2.rectangle(frame, (left, top), (right, bottom), color, 2)
#         cv2.putText(frame, name, (left, top - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

#         # Ghi điểm danh 1 lần/ngày
#         if name != "Unknown" and name not in logged_today:
#             now = datetime.now()
#             date = now.strftime("%Y-%m-%d")
#             time = now.strftime("%H:%M:%S")
#             with open(ATTENDANCE_FILE, "a", newline="") as f:
#                 writer = csv.writer(f)
#                 writer.writerow([date, time, name, "Present"])
#             logged_today.add(name)
#             print(f"✅ Attendance logged: {name} @ {date} {time}")

#     cv2.imshow("🎯 AI Face Attendance — Q = Quit", frame)
#     if cv2.waitKey(1) & 0xFF == ord("q"):
#         break

# cap.release()
# cv2.destroyAllWindows()
# print("✅ System stopped!")

# import os
# import cv2
# import pickle
# import face_recognition
# import numpy as np
# import csv
# from datetime import datetime

# # ====== Cấu hình thư mục ======
# ENCODINGS_DIR = r"D:\monthu2\student-attendance-systeam\data\encodings"
# ATTENDANCE_FILE = r"D:\monthu2\student-attendance-systeam\data\attendance_logs.csv"

# # Tạo CSV nếu chưa có
# if not os.path.exists(ATTENDANCE_FILE):
#     with open(ATTENDANCE_FILE, mode="w", newline="") as f:
#         writer = csv.writer(f)
#         writer.writerow(["date", "time", "name", "status"])
#     print("📄 Created attendance_logs.csv")

# # Load danh sách đã điểm danh hôm nay
# today = datetime.now().strftime("%Y-%m-%d")
# logged_today = set()
# if os.path.exists(ATTENDANCE_FILE):
#     with open(ATTENDANCE_FILE, mode="r") as f:
#         reader = csv.reader(f)
#         next(reader, None)
#         for row in reader:
#             if row[0] == today:
#                 logged_today.add(row[2])

# # Load encodings
# known_encodings = []
# known_names = []
# print("🔍 Loading encodings...")
# for file in os.listdir(ENCODINGS_DIR):
#     if file.endswith(".pkl"):
#         data = pickle.load(open(os.path.join(ENCODINGS_DIR, file), "rb"))
#         for enc in data["encodings"]:
#             known_encodings.append(enc)
#             known_names.append(data["name"])
# print(f"✅ Loaded {len(known_encodings)} encodings!")

# # Mở webcam
# cap = cv2.VideoCapture(0)
# if not cap.isOpened():
#     print("❌ Webcam not detected!")
#     exit()
# print("🎥 Camera started — Press 'q' to quit")

# while True:
#     ret, frame = cap.read()
#     if not ret:
#         break

#     rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
#     rgb_frame = rgb_frame.astype(np.uint8)

#     locations = face_recognition.face_locations(rgb_frame, model="hog")
#     encodings = face_recognition.face_encodings(rgb_frame, locations)

#     for (top, right, bottom, left), face_enc in zip(locations, encodings):
#         matches = face_recognition.compare_faces(known_encodings, face_enc, tolerance=0.48)
#         name = "Unknown"

#         if True in matches:
#             matchedIdxs = np.where(matches)[0]
#             name_counts = {}
#             for i in matchedIdxs:
#                 name_counts[known_names[i]] = name_counts.get(known_names[i], 0) + 1
#             name = max(name_counts, key=name_counts.get)

#         # Vẽ khung mặt và tên
#         color = (0, 255, 0) if name != "Unknown" else (0, 0, 255)
#         cv2.rectangle(frame, (left, top), (right, bottom), color, 2)
#         cv2.putText(frame, name, (left, top - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

#         # Ghi điểm danh 1 lần/ngày
#         if name != "Unknown" and name not in logged_today:
#             now = datetime.now()
#             date = now.strftime("%Y-%m-%d")
#             time = now.strftime("%H:%M:%S")
#             with open(ATTENDANCE_FILE, "a", newline="") as f:
#                 writer = csv.writer(f)
#                 writer.writerow([date, time, name, "Present"])
#             logged_today.add(name)
#             print(f"✅ Attendance logged: {name} @ {date} {time}")

#     cv2.imshow("🎯 AI Face Attendance — Q = Quit", frame)
#     if cv2.waitKey(1) & 0xFF == ord("q"):
#         break

# cap.release()
# cv2.destroyAllWindows()
# print("✅ System stopped!")

import os
import cv2
import pickle
import face_recognition
import numpy as np
import csv
from datetime import datetime

# ====== Cấu hình thư mục ======
ENCODINGS_DIR = r"D:\monthu2\student-attendance-systeam\data\encodings"
ATTENDANCE_FILE = r"D:\monthu2\student-attendance-systeam\data\attendance_logs.csv"

# ====== Tạo CSV nếu chưa có ======
if not os.path.exists(ATTENDANCE_FILE):
    with open(ATTENDANCE_FILE, mode="w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["date", "time", "name", "status"])
    print("📄 Created attendance_logs.csv")

# ====== Load danh sách đã điểm danh hôm nay ======
today = datetime.now().strftime("%Y-%m-%d")
logged_today = set()
if os.path.exists(ATTENDANCE_FILE):
    with open(ATTENDANCE_FILE, mode="r") as f:
        reader = csv.reader(f)
        next(reader, None)
        for row in reader:
            if row[0] == today:
                logged_today.add(row[2])

# ====== Load encodings ======
known_encodings = []
known_names = []
print("🔍 Loading encodings...")
for file in os.listdir(ENCODINGS_DIR):
    if file.endswith(".pkl"):
        data = pickle.load(open(os.path.join(ENCODINGS_DIR, file), "rb"))
        for enc in data["encodings"]:
            known_encodings.append(enc)
            known_names.append(data["info"]["name"])  # fix: dùng info["name"]
print(f"✅ Loaded {len(known_encodings)} encodings from {len(set(known_names))} students")
print("Students:", set(known_names))

if len(known_encodings) == 0:
    print("⚠️ Chưa có encodings. Vui lòng tạo encoding trước khi chạy webcam.")
    exit()

# ====== Mở webcam ======
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("❌ Webcam not detected!")
    exit()
print("🎥 Camera started — Press 'q' to quit")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # ====== Nhận diện khuôn mặt ======
    locations = face_recognition.face_locations(rgb_frame, model="hog")
    encodings = face_recognition.face_encodings(rgb_frame, locations)

    for (top, right, bottom, left), face_enc in zip(locations, encodings):
        matches = face_recognition.compare_faces(known_encodings, face_enc, tolerance=0.55)  # tăng tolerance
        name = "Unknown"

        if True in matches:
            matchedIdxs = np.where(matches)[0]
            name_counts = {}
            for i in matchedIdxs:
                name_counts[known_names[i]] = name_counts.get(known_names[i], 0) + 1
            name = max(name_counts, key=name_counts.get)

        # Vẽ khung mặt và tên
        color = (0, 255, 0) if name != "Unknown" else (0, 0, 255)
        cv2.rectangle(frame, (left, top), (right, bottom), color, 2)
        cv2.putText(frame, name, (left, top - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

        # ====== Ghi điểm danh 1 lần/ngày ======
        if name != "Unknown" and name not in logged_today:
            now = datetime.now()
            date = now.strftime("%Y-%m-%d")
            time = now.strftime("%H:%M:%S")
            with open(ATTENDANCE_FILE, "a", newline="") as f:
                writer = csv.writer(f)
                writer.writerow([date, time, name, "Present"])
            logged_today.add(name)
            print(f"✅ Attendance logged: {name} @ {date} {time}")

    cv2.imshow("🎯 AI Face Attendance — Q = Quit", frame)
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()
print("✅ System stopped!")
