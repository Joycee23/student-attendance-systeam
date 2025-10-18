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

# ====== Load encodings sinh viên ======
encodings_path = os.path.join(Config.BASE_DIR, 'data', 'encodings')
known_face_encodings = []
known_face_names = []

for file in os.listdir(encodings_path):
    if file.endswith('.pkl'):
        student_id = os.path.splitext(file)[0]
        with open(os.path.join(encodings_path, file), 'rb') as f:
            data = pickle.load(f)

        # Trường hợp file lưu list encodings
        if isinstance(data, dict) and "encodings" in data:
            enc_list = data["encodings"]
        elif isinstance(data, list):
            enc_list = data
        else:
            enc_list = [data]

        for enc in enc_list:
            if isinstance(enc, np.ndarray):
                known_face_encodings.append(enc)
                known_face_names.append(student_id)

print(f"✅ Loaded {len(known_face_encodings)} encodings from {len(set(known_face_names))} students.")


def mark_attendance(student_name):
    """Gọi API để lưu điểm danh"""
    try:
        resp = requests.post(f"{Config.API_URL}/attendance/mark", json={"name": student_name})
        if resp.status_code == 200:
            print(f"✅ Attendance marked: {student_name}")
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

    # ---------- Routes ----------
    @app.route('/')
    def index():
        return jsonify({
            'service': 'Face Recognition AI Service',
            'version': '1.0.0',
            'status': 'running',
        })

    @app.route('/camera')
    def camera_page():
        return render_template('index.html')

    # ---------- Face recognition ----------
    def recognize_face(frame):
        if frame is None or frame.size == 0:
            return []

        # Chuyển về RGB chuẩn
        if len(frame.shape) == 2:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_GRAY2RGB)
        elif frame.shape[2] == 4:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGRA2BGR)
            rgb_frame = cv2.cvtColor(rgb_frame, cv2.COLOR_BGR2RGB)
        else:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # Nhận diện khuôn mặt
        face_locations = face_recognition.face_locations(rgb_frame)
        face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)

        recognized_faces = []

        for encoding, (top, right, bottom, left) in zip(face_encodings, face_locations):
            matches = face_recognition.compare_faces(known_face_encodings, encoding, tolerance=0.45)
            name = "Unknown"

            if True in matches:
                match_index = matches.index(True)
                name = known_face_names[match_index]
                mark_attendance(name)

            recognized_faces.append((name, (top, right, bottom, left)))

        return recognized_faces

    # ---------- Camera stream ----------
    def gen_frames():
        camera = cv2.VideoCapture(0)
        if not camera.isOpened():
            print("❌ Cannot open camera")
            return

        while True:
            success, frame = camera.read()
            if not success:
                continue

            frame = cv2.resize(frame, (640, 480))
            try:
                faces = recognize_face(frame)
            except Exception as e:
                print(f"⚠️ Face recognition error: {e}")
                faces = []

            # Vẽ khung & tên
            for name, (top, right, bottom, left) in faces:
                color = (0, 255, 0) if name != "Unknown" else (0, 0, 255)
                cv2.rectangle(frame, (left, top), (right, bottom), color, 2)
                cv2.putText(frame, name, (left, top - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)

            # Encode lại ảnh
            ret, buffer = cv2.imencode('.jpg', frame)
            frame_bytes = buffer.tobytes()
            yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

        camera.release()

    @app.route('/video_feed')
    def video_feed():
        return Response(gen_frames(),
                        mimetype='multipart/x-mixed-replace; boundary=frame')

    return app


if __name__ == '__main__':
    app = create_app()
    print("=" * 60)
    print("🚀 Face Recognition AI Service")
    print("=" * 60)
    print(f"📍 Host: {Config.FLASK_HOST}")
    print(f"🔌 Port: {Config.FLASK_PORT}")
    print("=" * 60)
    app.run(host=Config.FLASK_HOST, port=Config.FLASK_PORT, debug=Config.FLASK_DEBUG)
