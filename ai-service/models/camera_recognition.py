import cv2
import face_recognition
import os

# === Đường dẫn thư mục chứa hình ảnh mẫu khuôn mặt đã biết ===
KNOWN_FACES_DIR = "data/encodings"  # hoặc thư mục chứa ảnh khuôn mặt của bạn

# === Load các khuôn mặt đã biết (nếu có) ===
known_faces = []
known_names = []

print("🔍 Loading known faces...")

for name in os.listdir(KNOWN_FACES_DIR):
    for filename in os.listdir(f"{KNOWN_FACES_DIR}/{name}"):
        image = face_recognition.load_image_file(f"{KNOWN_FACES_DIR}/{name}/{filename}")
        encoding = face_recognition.face_encodings(image)[0]
        known_faces.append(encoding)
        known_names.append(name)

print(f"✅ Loaded {len(known_faces)} known faces.")

# === Mở camera (0 là webcam mặc định) ===
video_capture = cv2.VideoCapture(0)

print("🎥 Starting camera... (Press 'q' to quit)")

while True:
    ret, frame = video_capture.read()
    if not ret:
        print("⚠️ Cannot access camera.")
        break

    # Thu nhỏ ảnh để xử lý nhanh hơn
    small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
    rgb_small_frame = small_frame[:, :, ::-1]

    # Nhận diện khuôn mặt
    face_locations = face_recognition.face_locations(rgb_small_frame)
    face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)

    for (top, right, bottom, left), face_encoding in zip(face_locations, face_encodings):
        matches = face_recognition.compare_faces(known_faces, face_encoding)
        name = "Unknown"

        if True in matches:
            first_match_index = matches.index(True)
            name = known_names[first_match_index]

        # Phóng to lại vị trí khuôn mặt theo tỷ lệ 4x
        top *= 4
        right *= 4
        bottom *= 4
        left *= 4

        # Vẽ khung + tên
        cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)
        cv2.rectangle(frame, (left, bottom - 35), (right, bottom), (0, 255, 0), cv2.FILLED)
        cv2.putText(frame, name, (left + 6, bottom - 6), cv2.FONT_HERSHEY_DUPLEX, 0.9, (0, 0, 0), 1)

    cv2.imshow("Face Recognition Camera", frame)

    # Nhấn phím 'q' để thoát
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

video_capture.release()
cv2.destroyAllWindows()
print("👋 Camera stopped.")
