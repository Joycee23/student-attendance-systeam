import face_recognition
import pickle
import os

# Thông tin sinh viên
student_name = "Nguyen Van A"
student_id = "12345"
image_path = "data/images/student1/student1.jpg"

# Load ảnh
image = face_recognition.load_image_file(image_path)
encodings = face_recognition.face_encodings(image)

if len(encodings) == 0:
    print("Không tìm thấy khuôn mặt trong ảnh!")
    exit()

# Lấy encoding đầu tiên
encoding = encodings[0]

# Lưu vào file pickle
data = {"names": [student_name], "student_ids": [student_id], "encodings": [encoding]}
encodings_folder = "data/encodings"
os.makedirs(encodings_folder, exist_ok=True)

with open(os.path.join(encodings_folder, "student_encodings.pkl"), "wb") as f:
    pickle.dump(data, f)

print("✅ Encoding của sinh viên đã được lưu!")
