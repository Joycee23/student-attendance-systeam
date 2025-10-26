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
# ai-service/models/camera_recognition.py
import cv2
import face_recognition
import os
import numpy as np
import pickle
import argparse
import time
from collections import deque

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # ai-service/models -> ai-service
ENC_DIR = os.path.join(BASE_DIR, "data", "encodings")

# ---------- Argument parser ----------
parser = argparse.ArgumentParser(description="Camera multi-face recognition (webcam or IP)")
parser.add_argument("--source", type=str, default="0",
                    help="camera source. '0' for default webcam, or IP/rtsp URL")
parser.add_argument("--tolerance", type=float, default=0.48,
                    help="face distance threshold (lower = stricter)")
parser.add_argument("--scale", type=float, default=0.25,
                    help="resize scale for speed (0.25 = process at 1/4 size)")
parser.add_argument("--post-url", type=str, default="",
                    help="(optional) POST URL to send recognition result (attendance).")
parser.add_argument("--debounce-sec", type=float, default=10.0,
                    help="seconds to debounce same student before re-marking")
parser.add_argument("--display", action="store_true", help="show window")
args = parser.parse_args()

# ---------- Load encodings (each file per student: {encodings: [...], info: {...}}) ----------
known_encodings = []
known_infos = []

if not os.path.exists(ENC_DIR):
    raise SystemExit(f"Encodings folder not found: {ENC_DIR}")

for f in os.listdir(ENC_DIR):
    if not f.lower().endswith(".pkl"):
        continue
    try:
        path = os.path.join(ENC_DIR, f)
        with open(path, "rb") as fh:
            data = pickle.load(fh)
        encs = data.get("encodings", [])
        info = data.get("info", {})
        # if info missing, build from filename
        if not info:
            sid = os.path.splitext(f)[0]
            info = {"student_id": sid, "name": sid, "class": "Unknown"}
        for e in encs:
            if isinstance(e, np.ndarray):
                known_encodings.append(e)
                known_infos.append(info)
    except Exception as e:
        print(f"⚠️ Failed to load {f}: {e}")

print(f"✅ Loaded {len(known_encodings)} encodings for {len(set(i['student_id'] for i in known_infos))} students")

# ---------- Video source ----------
src = args.source
if src.isdigit():
    cam_src = int(src)
else:
    cam_src = src  # could be "rtsp://..." or http stream

cap = cv2.VideoCapture(cam_src)
if not cap.isOpened():
    raise SystemExit(f"❌ Cannot open camera source: {cam_src}")

# ---------- Debounce tracker: student_id -> last_seen_time ----------
last_seen = {}  # {student_id: timestamp}
recent_unknown = deque(maxlen=100)  # store unknown face hashes if needed

def mark_attendance(info):
    """Mark attendance: simple debounce and optional POST"""
    sid = info.get("student_id")
    now = time.time()
    last = last_seen.get(sid, 0)
    if now - last < args.debounce_sec:
        return False  # already recently marked
    last_seen[sid] = now
    print(f"✅ Detected: {info.get('name')} ({sid})  time={time.strftime('%H:%M:%S')}")
    # optional: post to attendance API
    if args.post_url:
        try:
            import requests
            payload = {
                "student_id": sid,
                "name": info.get("name"),
                "classroom_id": info.get("class", "Unknown"),
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S")
            }
            resp = requests.post(args.post_url, json=payload, timeout=5)
            print(f"→ POST {args.post_url} => {resp.status_code}")
        except Exception as e:
            print(f"⚠️ POST error: {e}")
    return True

process_frame = True
fps_time = time.time()
frame_count = 0

print("🎥 Press Ctrl+C to stop. Processing...")

try:
    while True:
        ret, frame = cap.read()
        if not ret:
            print("⚠️ Failed to read frame; retrying...")
            time.sleep(0.5)
            continue

        # optionally display original FPS count
        frame_count += 1
        h, w = frame.shape[:2]

        # resize for speed
        small = cv2.resize(frame, (0, 0), fx=args.scale, fy=args.scale)
        rgb_small = cv2.cvtColor(small, cv2.COLOR_BGR2RGB)

        if process_frame:
            # detect faces and encodings
            face_locations = face_recognition.face_locations(rgb_small, model="hog")  # "cnn" if GPU & dlib compiled
            face_encodings = face_recognition.face_encodings(rgb_small, face_locations)

            results = []
            for enc, loc in zip(face_encodings, face_locations):
                if len(known_encodings) == 0:
                    results.append((None, loc, None))
                    continue
                distances = face_recognition.face_distance(known_encodings, enc)
                best_idx = np.argmin(distances)
                best_dist = float(distances[best_idx])
                if best_dist <= args.tolerance:
                    info = known_infos[best_idx]
                    results.append((info, loc, best_dist))
                    # attempt mark attendance (debounced inside)
                    mark_attendance(info)
                else:
                    results.append((None, loc, best_dist))
                    # optional: collect unknown face (hash) for review
                    # unknown_hash = np.round(enc[:8], 3).tobytes()
                    # recent_unknown.append(unknown_hash)
        process_frame = not process_frame

        # draw boxes & labels on original size frame
        # scale back locations
        if 'results' in locals():
            for info, loc, dist in results:
                top, right, bottom, left = loc
                # scale up to original
                top = int(top / args.scale)
                right = int(right / args.scale)
                bottom = int(bottom / args.scale)
                left = int(left / args.scale)

                color = (0, 255, 0) if info else (0, 0, 255)
                cv2.rectangle(frame, (left, top), (right, bottom), color, 2)

                if info:
                    label = f"{info.get('name')} ({info.get('student_id')})"
                    sub = f"{info.get('class', '')} dist:{dist:.2f}"
                else:
                    label = "Unknown"
                    sub = f"dist:{dist:.2f}"

                cv2.putText(frame, label, (left, top - 22), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
                cv2.putText(frame, sub, (left, top - 2), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)

        # display (optional)
        if args.display:
            # compute FPS
            if time.time() - fps_time >= 1.0:
                fps = frame_count / (time.time() - fps_time)
                fps_time = time.time()
                frame_count = 0
            cv2.imshow("MultiFace Recognition", frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

except KeyboardInterrupt:
    print("\n🔴 Stopped by user")

finally:
    cap.release()
    if args.display:
        cv2.destroyAllWindows()
