import face_recognition
import pickle
import os

# ====== Thông tin sinh viên ======
student_id = "12345"
student_name = "TranThiB"
student_class = "CNTT01"
image_path = "data/images/SV002_TranThiB/1.jpg"

# ====== Load ảnh và tạo encoding ======
image = face_recognition.load_image_file(image_path)
encodings = face_recognition.face_encodings(image)

if len(encodings) == 0:
    print("❌ Không tìm thấy khuôn mặt trong ảnh!")
    exit()

encoding = encodings[0]

# ====== Tạo dữ liệu theo đúng định dạng Flask dùng ======
data = {
    "encodings": [encoding],
    "info": {
        "student_id": student_id,
        "name": student_name,
        "class": student_class
    }
}

# ====== Lưu mỗi sinh viên 1 file riêng ======
encodings_folder = "data/encodings"
os.makedirs(encodings_folder, exist_ok=True)

file_path = os.path.join(encodings_folder, f"{student_id}.pkl")

with open(file_path, "wb") as f:
    pickle.dump(data, f)

print(f"✅ Đã lưu encoding cho sinh viên {student_name} ({student_id}) tại {file_path}")
