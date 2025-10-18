# # # from flask import Flask, jsonify
# # # from flask_cors import CORS
# # # from config import Config
# # # from api import api_bp
# # # import os

# # # # def create_app():
# # # #     """Factory pattern để tạo Flask app"""
    
# # # #     # Khởi tạo Flask app
# # # #     app = Flask(__name__)
    
# # # #     # Load config
# # # #     app.config.from_object(Config)
    
# # # #     # Khởi tạo thư mục cần thiết
# # # #     Config.init_app()
    
# # # #     # CORS
# # # #     CORS(app, resources={
# # # #         r"/api/*": {
# # # #             "origins": Config.ALLOWED_ORIGINS,
# # # #             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
# # # #             "allow_headers": ["Content-Type", "Authorization"]
# # # #         }
# # # #     })
    
# # # #     # Register blueprints
# # # #     app.register_blueprint(api_bp)
    
# # # #     # Root endpoint
# # # #     @app.route('/')
# # # #     def index():
# # # #         return jsonify({
# # # #             'service': 'Face Recognition AI Service',
# # # #             'version': '1.0.0',
# # # #             'status': 'running',
# # # #             'endpoints': {
# # # #                 'health': '/api/health',
# # # #                 'register': '/api/face/register',
# # # #                 'recognize': '/api/face/recognize',
# # # #                 'recognize_multiple': '/api/face/recognize-multiple',
# # # #                 'verify': '/api/face/verify',
# # # #                 'delete': '/api/face/delete/<student_id>',
# # # #                 'registered': '/api/face/registered',
# # # #                 'statistics': '/api/statistics',
# # # #                 'batch_register': '/api/face/batch-register'
# # # #             }
# # # #         })
    
# # # #     # Error handlers
# # # #     @app.errorhandler(404)
# # # #     def not_found(error):
# # # #         return jsonify({
# # # #             'success': False,
# # # #             'message': 'Endpoint not found',
# # # #             'error': str(error)
# # # #         }), 404
    
# # # #     @app.errorhandler(500)
# # # #     def internal_error(error):
# # # #         return jsonify({
# # # #             'success': False,
# # # #             'message': 'Internal server error',
# # # #             'error': str(error)
# # # #         }), 500
    
# # # #     @app.errorhandler(413)
# # # #     def request_entity_too_large(error):
# # # #         return jsonify({
# # # #             'success': False,
# # # #             'message': 'File too large',
# # # #             'error': str(error)
# # # #         }), 413
    
# # # #         # Route hiển thị camera trực tiếp
# # # #     camera = cv2.VideoCapture(0)  # 0 là webcam mặc định

# # # #     def gen_frames():
# # # #         """Đọc frame từ camera và stream dưới dạng MJPEG"""
# # # #         while True:
# # # #             success, frame = camera.read()
# # # #             if not success:
# # # #                 break
# # # #             else:
# # # #                 ret, buffer = cv2.imencode('.jpg', frame)
# # # #                 frame = buffer.tobytes()
# # # #                 yield (b'--frame\r\n'
# # # #                        b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

# # # #     @app.route('/video_feed')
# # # #     def video_feed():
# # # #         """Luồng video từ webcam"""
# # # #         return Response(gen_frames(),
# # # #                         mimetype='multipart/x-mixed-replace; boundary=frame')
        
        
# # # #     return app

# # # # if __name__ == '__main__':
# # # #     app = create_app()
    
# # # #     print("=" * 60)
# # # #     print("🚀 Face Recognition AI Service")
# # # #     print("=" * 60)
# # # #     print(f"📍 Host: {Config.FLASK_HOST}")
# # # #     print(f"🔌 Port: {Config.FLASK_PORT}")
# # # #     print(f"🔧 Environment: {Config.FLASK_ENV}")
# # # #     print(f"📁 Encodings Path: {Config.ENCODINGS_PATH}")
# # # #     print("=" * 60)
# # # #     print("✅ Server is starting...")
# # # #     print("=" * 60)
    
# # # #     app.run(
# # # #         host=Config.FLASK_HOST,
# # # #         port=Config.FLASK_PORT,
# # # #         debug=Config.FLASK_DEBUG
# # # #     )

# # # import cv2
# # # from flask import Flask, jsonify, Response, render_template
# # # from flask_cors import CORS
# # # from config import Config
# # # from api import api_bp

# # # def create_app():
# # #     """Factory pattern để tạo Flask app"""
    
# # #     # Khởi tạo Flask app
# # #     app = Flask(__name__)
    
# # #     # Load config
# # #     app.config.from_object(Config)
    
# # #     # Khởi tạo thư mục cần thiết
# # #     Config.init_app()
    
# # #     # CORS
# # #     CORS(app, resources={
# # #         r"/api/*": {
# # #             "origins": Config.ALLOWED_ORIGINS,
# # #             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
# # #             "allow_headers": ["Content-Type", "Authorization"]
# # #         }
# # #     })
    
# # #     # Register blueprints
# # #     app.register_blueprint(api_bp)
    
# # #     # Root endpoint
# # #     @app.route('/')
# # #     def index():
# # #         return jsonify({
# # #             'service': 'Face Recognition AI Service',
# # #             'version': '1.0.0',
# # #             'status': 'running',
# # #             'endpoints': {
# # #                 'health': '/api/health',
# # #                 'register': '/api/face/register',
# # #                 'recognize': '/api/face/recognize',
# # #                 'recognize_multiple': '/api/face/recognize-multiple',
# # #                 'verify': '/api/face/verify',
# # #                 'delete': '/api/face/delete/<student_id>',
# # #                 'registered': '/api/face/registered',
# # #                 'statistics': '/api/statistics',
# # #                 'batch_register': '/api/face/batch-register'
# # #             }
# # #         })
    
# # #     # Error handlers
# # #     @app.errorhandler(404)
# # #     def not_found(error):
# # #         return jsonify({
# # #             'success': False,
# # #             'message': 'Endpoint not found',
# # #             'error': str(error)
# # #         }), 404
    
# # #     @app.errorhandler(500)
# # #     def internal_error(error):
# # #         return jsonify({
# # #             'success': False,
# # #             'message': 'Internal server error',
# # #             'error': str(error)
# # #         }), 500
    
# # #     @app.errorhandler(413)
# # #     def request_entity_too_large(error):
# # #         return jsonify({
# # #             'success': False,
# # #             'message': 'File too large',
# # #             'error': str(error)
# # #         }), 413
    
# # #     # --------- Camera streaming ----------
# # #     def gen_frames():
# # #         """Đọc frame từ camera và stream dưới dạng MJPEG"""
# # #         camera = cv2.VideoCapture(0)
# # #         if not camera.isOpened():
# # #             print("❌ Cannot open camera")
# # #             return
# # #         try:
# # #             while True:
# # #                 success, frame = camera.read()
# # #                 if not success:
# # #                     break
# # #                 ret, buffer = cv2.imencode('.jpg', frame)
# # #                 frame_bytes = buffer.tobytes()
# # #                 yield (b'--frame\r\n'
# # #                        b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
# # #         finally:
# # #             camera.release()
    
# # #     @app.route('/video_feed')
# # #     def video_feed():
# # #         """Luồng video từ webcam"""
# # #         return Response(gen_frames(),
# # #                         mimetype='multipart/x-mixed-replace; boundary=frame')
        
# # #     @app.route('/camera')
# # #     def camera_page():
# # #         """Trang hiển thị video camera"""
# # #         return render_template('index.html')
    
# # #     return app


# # # if __name__ == '__main__':
# # #     app = create_app()
    
# # #     print("=" * 60)
# # #     print("🚀 Face Recognition AI Service")
# # #     print("=" * 60)
# # #     print(f"📍 Host: {Config.FLASK_HOST}")
# # #     print(f"🔌 Port: {Config.FLASK_PORT}")
# # #     print(f"🔧 Environment: {Config.FLASK_ENV}")
# # #     print(f"📁 Encodings Path: {Config.ENCODINGS_PATH}")
# # #     print("=" * 60)
# # #     print("✅ Server is starting...")
# # #     print("=" * 60)
# # #     print(os.path.abspath("templates/index.html"))
    
# # #     app.run(
# # #         host=Config.FLASK_HOST,
# # #         port=Config.FLASK_PORT,
# # #         debug=Config.FLASK_DEBUG
# # #     )

# # import os
# # import cv2
# # from flask import Flask, jsonify, Response, render_template
# # from flask_cors import CORS
# # from config import Config
# # from api import api_bp

# # # Lấy đường dẫn tuyệt đối của thư mục chứa app.py
# # BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# # # Khởi tạo Flask app với đường dẫn tuyệt đối cho template và static
# # app = Flask(
# #     __name__,
# #     template_folder=os.path.join(BASE_DIR, 'templates'),
# #     static_folder=os.path.join(BASE_DIR, 'static')
# # )

# # # Load config
# # app.config.from_object(Config)

# # # Khởi tạo thư mục cần thiết
# # Config.init_app()

# # # CORS
# # CORS(app, resources={
# #     r"/api/*": {
# #         "origins": Config.ALLOWED_ORIGINS,
# #         "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
# #         "allow_headers": ["Content-Type", "Authorization"]
# #     }
# # })

# # # Register blueprints
# # app.register_blueprint(api_bp)

# # # Root endpoint
# # @app.route('/')
# # def index():
# #     return jsonify({
# #         'service': 'Face Recognition AI Service',
# #         'version': '1.0.0',
# #         'status': 'running',
# #         'endpoints': {
# #             'health': '/api/health',
# #             'register': '/api/face/register',
# #             'recognize': '/api/face/recognize',
# #             'recognize_multiple': '/api/face/recognize-multiple',
# #             'verify': '/api/face/verify',
# #             'delete': '/api/face/delete/<student_id>',
# #             'registered': '/api/face/registered',
# #             'statistics': '/api/statistics',
# #             'batch_register': '/api/face/batch-register'
# #         }
# #     })

# # # Error handlers
# # @app.errorhandler(404)
# # def not_found(error):
# #     return jsonify({'success': False, 'message': 'Endpoint not found', 'error': str(error)}), 404

# # @app.errorhandler(500)
# # def internal_error(error):
# #     return jsonify({'success': False, 'message': 'Internal server error', 'error': str(error)}), 500

# # @app.errorhandler(413)
# # def request_entity_too_large(error):
# #     return jsonify({'success': False, 'message': 'File too large', 'error': str(error)}), 413

# # # Camera streaming
# # def gen_frames():
# #     camera = cv2.VideoCapture(0)
# #     if not camera.isOpened():
# #         print("❌ Cannot open camera")
# #         return
# #     try:
# #         while True:
# #             success, frame = camera.read()
# #             if not success:
# #                 break
# #             ret, buffer = cv2.imencode('.jpg', frame)
# #             frame_bytes = buffer.tobytes()
# #             yield (b'--frame\r\n'
# #                    b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
# #     finally:
# #         camera.release()

# # @app.route('/video_feed')
# # def video_feed():
# #     return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

# # @app.route('/camera')
# # def camera_page():
# #     return render_template('index.html')

# # if __name__ == '__main__':
# #     print("="*60)
# #     print("🚀 Face Recognition AI Service")
# #     print("="*60)
# #     print(f"📍 Host: {Config.FLASK_HOST}")
# #     print(f"🔌 Port: {Config.FLASK_PORT}")
# #     print(f"🔧 Environment: {Config.FLASK_ENV}")
# #     print(f"📁 Encodings Path: {Config.ENCODINGS_PATH}")
# #     print("="*60)
# #     print("✅ Server is starting...")
# #     print("="*60)
# #     print("Template path:", os.path.join(BASE_DIR, 'templates', 'index.html'))
    
# #     app.run(host=Config.FLASK_HOST, port=Config.FLASK_PORT, debug=Config.FLASK_DEBUG)


# import os
# import cv2
# import pickle
# import face_recognition
# from flask import Flask, jsonify, Response, render_template
# from flask_cors import CORS
# from config import Config
# from api import api_bp
# import requests  # Dùng để gọi API điểm danh

# # Load encodings sinh viên
# encodings_path = os.path.join(Config.BASE_DIR, 'data', 'encodings')
# face_encodings_db = {}

# for file in os.listdir(encodings_path):
#     if file.endswith('.pkl'):
#         student_id = os.path.splitext(file)[0]
#         with open(os.path.join(encodings_path, file), 'rb') as f:
#             face_encodings_db[student_id] = pickle.load(f)

# print(f"✅ Loaded {len(face_encodings_db)} student encodings")


# def mark_attendance(student_name):
#     """Gọi API để lưu điểm danh"""
#     try:
#         resp = requests.post(f"{Config.API_URL}/attendance/mark", json={"name": student_name})
#         if resp.status_code == 200:
#             print(f"✅ Attendance marked: {student_name}")
#         else:
#             print(f"⚠️ Failed to mark attendance: {student_name}")
#     except Exception as e:
#         print(f"⚠️ Error calling attendance API: {e}")


# def create_app():
#     app = Flask(__name__)
#     app.config.from_object(Config)
#     Config.init_app()
#     CORS(app, resources={r"/api/*": {"origins": Config.ALLOWED_ORIGINS}})

#     app.register_blueprint(api_bp)

#     # ---------- Endpoints ----------
#     @app.route('/')
#     def index():
#         return jsonify({
#             'service': 'Face Recognition AI Service',
#             'version': '1.0.0',
#             'status': 'running',
#         })

#     @app.errorhandler(404)
#     def not_found(error):
#         return jsonify({'success': False, 'message': 'Endpoint not found'}), 404

#     @app.errorhandler(500)
#     def internal_error(error):
#         return jsonify({'success': False, 'message': 'Internal server error'}), 500

#     @app.route('/camera')
#     def camera_page():
#         return render_template('index.html')

#     # ---------- Camera streaming ----------
#     def recognize_face(frame):
#         if frame is None:
#             return []

#         rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
#         face_locations = face_recognition.face_locations(rgb_frame)
#         face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)

#         names_in_frame = []

#         for (top, right, bottom, left), face_encoding in zip(face_locations, face_encodings):
#             matches = face_recognition.compare_faces(list(face_encodings_db.values()), face_encoding)
#             name = "Unknown"
#             if True in matches:
#                 first_match_index = matches.index(True)
#                 name = list(face_encodings_db.keys())[first_match_index]
#                 mark_attendance(name)
#             names_in_frame.append((name, (top, right, bottom, left)))

#         return names_in_frame

#     def gen_frames():
#         camera = cv2.VideoCapture(0)
#         if not camera.isOpened():
#             print("❌ Cannot open camera")
#             return
#         try:
#             while True:
#                 success, frame = camera.read()
#                 if not success or frame is None:
#                     continue

#                 frame = cv2.resize(frame, (640, 480))

#                 try:
#                     names_in_frame = recognize_face(frame)
#                 except Exception as e:
#                     print(f"⚠️ Face recognition error: {e}")
#                     names_in_frame = []

#                 # Vẽ hộp + tên
#                 for name, (top, right, bottom, left) in names_in_frame:
#                     cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)
#                     cv2.putText(frame, name, (left, top - 10),
#                                 cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

#                 ret, buffer = cv2.imencode('.jpg', frame)
#                 frame_bytes = buffer.tobytes()
#                 yield (b'--frame\r\n'
#                        b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
#         finally:
#             camera.release()

#     @app.route('/video_feed')
#     def video_feed():
#         return Response(gen_frames(),
#                         mimetype='multipart/x-mixed-replace; boundary=frame')

#     return app


# if __name__ == '__main__':
#     app = create_app()
#     print("=" * 60)
#     print("🚀 Face Recognition AI Service")
#     print("=" * 60)
#     print(f"📍 Host: {Config.FLASK_HOST}")
#     print(f"🔌 Port: {Config.FLASK_PORT}")
#     print("=" * 60)
#     app.run(host=Config.FLASK_HOST, port=Config.FLASK_PORT, debug=Config.FLASK_DEBUG)
# import os
# import cv2
# import pickle
# import numpy as np
# import face_recognition
# from flask import Flask, jsonify, Response, render_template
# from flask_cors import CORS
# from config import Config
# from api import api_bp
# import requests
# import platform

# # ---------------- Load encodings sinh viên ----------------
# encodings_path = os.path.join(Config.BASE_DIR, 'data', 'encodings')
# known_face_encodings = []
# known_face_names = []

# for file in os.listdir(encodings_path):
#     if file.endswith('.pkl'):
#         student_id = os.path.splitext(file)[0]
#         with open(os.path.join(encodings_path, file), 'rb') as f:
#             data = pickle.load(f)
#         if isinstance(data, dict) and "encodings" in data:
#             enc_list = data["encodings"]
#         elif isinstance(data, list):
#             enc_list = data
#         else:
#             enc_list = [data]
#         for enc in enc_list:
#             if isinstance(enc, np.ndarray):
#                 known_face_encodings.append(enc)
#                 known_face_names.append(student_id)

# print(f"✅ Loaded {len(known_face_encodings)} encodings from {len(set(known_face_names))} students.")

# # ---------------- Thông tin sinh viên ----------------
# students_info = {
#     "sv001": {"name": "Nguyen Van A", "class": "CNTT1"},
#     "sv002": {"name": "Tran Thi B", "class": "CNTT2"},
#     "sv003": {"name": "Le Van C", "class": "CNTT1"},
#     # ... thêm sinh viên khác
# }

# # ---------------- Attendance ----------------
# def mark_attendance(student_id):
#     try:
#         resp = requests.post(f"{Config.API_URL}/attendance/mark", json={"name": student_id})
#         if resp.status_code == 200:
#             print(f"✅ Attendance marked: {student_id}")
#         else:
#             print(f"⚠️ API returned {resp.status_code}: {resp.text}")
#     except Exception as e:
#         print(f"⚠️ Error calling attendance API: {e}")

# # ---------------- Flask app ----------------
# def create_app():
#     app = Flask(__name__)
#     app.config.from_object(Config)
#     Config.init_app()
#     CORS(app, resources={r"/api/*": {"origins": Config.ALLOWED_ORIGINS}})
#     app.register_blueprint(api_bp)

#     @app.route('/')
#     def index():
#         return jsonify({
#             'service': 'Face Recognition AI Service',
#             'version': '1.0.0',
#             'status': 'running',
#         })

#     @app.route('/camera')
#     def camera_page():
#         return render_template('index.html')

#     # ---------- Safe face recognition ----------
#     def safe_recognize_face(frame):
#         if frame is None or frame.size == 0:
#             return []

#         frame = np.asarray(frame, dtype=np.uint8)

#         if frame.ndim not in [2, 3] or (frame.ndim == 3 and frame.shape[2] not in [1,3,4]):
#             print(f"⚠️ Skipping invalid frame: shape={frame.shape}, dtype={frame.dtype}")
#             return []

#         if frame.ndim == 2 or frame.shape[2] == 1:
#             rgb_frame = cv2.cvtColor(frame, cv2.COLOR_GRAY2RGB)
#         elif frame.shape[2] == 4:
#             rgb_frame = cv2.cvtColor(frame[:, :, :3], cv2.COLOR_BGRA2RGB)
#         else:
#             rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

#         try:
#             face_locations = face_recognition.face_locations(rgb_frame)
#             face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)
#         except Exception as e:
#             print(f"⚠️ Face recognition failed: {e}")
#             return []

#         recognized_faces = []
#         for encoding, (top, right, bottom, left) in zip(face_encodings, face_locations):
#             matches = face_recognition.compare_faces(known_face_encodings, encoding, tolerance=0.45)
#             student_id = "Unknown"
#             if True in matches:
#                 match_index = matches.index(True)
#                 student_id = known_face_names[match_index]
#                 mark_attendance(student_id)

#             info = students_info.get(student_id, {"name": student_id, "class": "Unknown"})
#             recognized_faces.append({
#                 "id": student_id,
#                 "name": info["name"],
#                 "class": info["class"],
#                 "box": (top, right, bottom, left)
#             })

#         return recognized_faces

#     # ---------- Camera stream ----------
#     def gen_frames():
#         os_type = platform.system()
#         if os_type == "Windows":
#             camera = cv2.VideoCapture(0, cv2.CAP_DSHOW)
#         else:
#             camera = cv2.VideoCapture(0)

#         if not camera.isOpened():
#             raise RuntimeError("❌ Cannot open camera")

#         try:
#             while True:
#                 success, frame = camera.read()
#                 if not success or frame is None or frame.size == 0:
#                     continue

#                 frame = cv2.resize(frame, (640, 480))
#                 faces = safe_recognize_face(frame)

#                 for f in faces:
#                     top, right, bottom, left = f["box"]
#                     color = (0,255,0) if f["id"] != "Unknown" else (0,0,255)
#                     cv2.rectangle(frame, (left, top), (right, bottom), color, 2)
#                     text = f'{f["id"]} | {f["name"]} | {f["class"]}'
#                     cv2.putText(frame, text, (left, top-10),
#                                 cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

#                 ret, buffer = cv2.imencode('.jpg', frame)
#                 if not ret:
#                     continue
#                 frame_bytes = buffer.tobytes()
#                 yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

#         except Exception as e:
#             print(f"❌ Camera stream error: {e}")
#         finally:
#             camera.release()
#             print("✅ Camera released safely")

#     @app.route('/video_feed')
#     def video_feed():
#         return Response(gen_frames(),
#                         mimetype='multipart/x-mixed-replace; boundary=frame')

#     return app

# # ---------- Run ----------
# if __name__ == '__main__':
#     app = create_app()
#     print("="*60)
#     print("🚀 Face Recognition AI Service")
#     print("="*60)
#     print(f"📍 Host: {Config.FLASK_HOST}")
#     print(f"🔌 Port: {Config.FLASK_PORT}")
#     print("="*60)
#     app.run(host=Config.FLASK_HOST, port=Config.FLASK_PORT, debug=Config.FLASK_DEBUG)
import os
import cv2
import pickle
import numpy as np
import face_recognition
from flask import Flask, jsonify, Response, render_template
from flask_cors import CORS
from config import Config
from api import api_bp
import requests
import platform
from threading import Lock

# ====== Load encodings sinh viên ======
encodings_path = os.path.join(Config.BASE_DIR, 'data', 'encodings')
known_face_encodings = []
known_face_data = []  # dict with id + name + class

for file in os.listdir(encodings_path):
    if file.endswith('.pkl'):
        student_id = os.path.splitext(file)[0]
        with open(os.path.join(encodings_path, file), 'rb') as f:
            data = pickle.load(f)

        if isinstance(data, dict) and "encodings" in data:
            enc_list = data["encodings"]
        elif isinstance(data, list):
            enc_list = data
        else:
            enc_list = [data]

        for enc in enc_list:
            if isinstance(enc, np.ndarray):
                known_face_encodings.append(enc)
                # Lưu thông tin student: idsv, name, class
                known_face_data.append({
                    'student_id': student_id,
                    'name': student_id,      # có thể thay bằng tên thật nếu lưu
                    'class': 'Class_01'      # ví dụ, sửa theo dữ liệu thật
                })

print(f"✅ Loaded {len(known_face_encodings)} encodings from {len(set(d['student_id'] for d in known_face_data))} students.")

# Dữ liệu realtime của các sinh viên đang nhìn camera
current_faces = []
faces_lock = Lock()

def mark_attendance(student):
    try:
        resp = requests.post(f"{Config.API_URL}/attendance/mark", json={
            "student_id": student['student_id'],
            "name": student['name'],
            "classroom_id": student['class']
        })
        if resp.status_code == 200:
            print(f"✅ Attendance marked: {student['name']}")
        else:
            print(f"⚠️ API returned {resp.status_code}: {resp.text}")
    except Exception as e:
        print(f"⚠️ Error calling attendance API: {e}")


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    Config.init_app()
    CORS(app, resources={r"/api/*": {"origins": Config.ALLOWED_ORIGINS}})
    app.register_blueprint(api_bp)

    @app.route('/')
    def index():
        return render_template('index.html')

    @app.route('/video_feed')
    def video_feed():
        return Response(gen_frames(),
                        mimetype='multipart/x-mixed-replace; boundary=frame')

    @app.route('/api/face/recognized')
    def api_recognized():
        with faces_lock:
            return jsonify(current_faces)

    # ---------- Safe face recognition ----------
    def safe_recognize_face(frame):
        if frame is None or frame.size == 0:
            return []

        frame = np.asarray(frame, dtype=np.uint8)

        if frame.ndim not in [2,3] or (frame.ndim==3 and frame.shape[2] not in [1,3,4]):
            return []

        if frame.ndim == 2 or frame.shape[2]==1:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_GRAY2RGB)
        elif frame.shape[2]==4:
            rgb_frame = cv2.cvtColor(frame[:,:,:3], cv2.COLOR_BGR2RGB)
        else:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        try:
            face_locations = face_recognition.face_locations(rgb_frame)
            face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)
        except Exception as e:
            print(f"⚠️ Face recognition failed: {e}")
            return []

        recognized = []
        for encoding, (top, right, bottom, left) in zip(face_encodings, face_locations):
            matches = face_recognition.compare_faces(known_face_encodings, encoding, tolerance=0.45)
            student = None
            if True in matches:
                match_index = matches.index(True)
                student = known_face_data[match_index]
                mark_attendance(student)
            recognized.append({
                'student': student,
                'location': {'top': top, 'right': right, 'bottom': bottom, 'left': left}
            })
        return recognized

    # ---------- Camera stream ----------
    def gen_frames():
        os_type = platform.system()
        if os_type == "Windows":
            camera = cv2.VideoCapture(0, cv2.CAP_DSHOW)
        else:
            camera = cv2.VideoCapture(0)

        if not camera.isOpened():
            raise RuntimeError("❌ Cannot open camera")

        try:
            while True:
                success, frame = camera.read()
                if not success or frame is None or frame.size == 0:
                    continue

                frame = cv2.resize(frame, (640,480))
                recognized = safe_recognize_face(frame)

                # Update current_faces realtime
                with faces_lock:
                    current_faces.clear()
                    for r in recognized:
                        if r['student'] is not None:
                            current_faces.append({
                                'student_id': r['student']['student_id'],
                                'name': r['student']['name'],
                                'class': r['student']['class'],
                                'location': r['location']
                            })

                # Vẽ khung & tên
                for r in recognized:
                    student = r['student']
                    loc = r['location']
                    color = (0,255,0) if student is not None else (0,0,255)
                    cv2.rectangle(frame, (loc['left'], loc['top']), (loc['right'], loc['bottom']), color, 2)
                    if student:
                        cv2.putText(frame, f"{student['name']} ({student['class']})",
                                    (loc['left'], loc['top']-10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

                ret, buffer = cv2.imencode('.jpg', frame)
                if not ret:
                    continue
                frame_bytes = buffer.tobytes()
                yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        finally:
            camera.release()
            print("✅ Camera released safely")

    return app


if __name__ == '__main__':
    app = create_app()
    print("="*60)
    print("🚀 Face Recognition AI Service (Realtime)")
    print("="*60)
    app.run(host=Config.FLASK_HOST, port=Config.FLASK_PORT, debug=False, threaded=False)
