# from flask import request, jsonify
# from . import api_bp
# from models.face_recognition_model import FaceRecognitionModel
# from utils.image_processing import ImageProcessor
# import os
# import time
# from werkzeug.utils import secure_filename
# from config import Config

# # Khởi tạo model
# face_model = FaceRecognitionModel()
# image_processor = ImageProcessor()

# # Helper function
# def allowed_file(filename):
#     return '.' in filename and filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS

# def success_response(data=None, message="Success", status=200):
#     response = {
#         'success': True,
#         'message': message,
#         'data': data
#     }
#     return jsonify(response), status

# def error_response(message="Error", status=400, data=None):
#     response = {
#         'success': False,
#         'message': message,
#         'data': data
#     }
#     return jsonify(response), status

# # ==================== HEALTH CHECK ====================
# @api_bp.route('/health', methods=['GET'])
# def health_check():
#     return success_response({
#         'status': 'healthy',
#         'timestamp': time.time(),
#         'registered_faces': len(face_model.known_ids)
#     }, "AI Service is running")

# # ==================== REGISTER FACE ====================
# @api_bp.route('/face/register', methods=['POST'])
# def register_face():
#     try:
#         student_id = request.form.get('student_id') or (request.json.get('student_id') if request.is_json else None)
#         if not student_id:
#             return error_response("student_id is required", 400)

#         image = None
#         if 'image' in request.files:
#             file = request.files['image']
#             if file.filename == '':
#                 return error_response("No file selected", 400)
#             is_valid, msg = image_processor.validate_image(file)
#             if not is_valid:
#                 return error_response(msg, 400)
#             image_bytes = file.read()
#             image = image_processor.load_image_from_bytes(image_bytes)
#         elif request.is_json and 'image' in request.json:
#             base64_string = request.json['image']
#             image = image_processor.load_image_from_base64(base64_string)

#         if image is None:
#             return error_response("Invalid image or no image provided", 400)

#         success, message, encoding = face_model.register_face(student_id, image)
#         if not success:
#             return error_response(message, 400)

#         return success_response({
#             'student_id': student_id,
#             'encoding_length': len(encoding) if encoding else 0
#         }, message, 201)

#     except Exception as e:
#         print(f"Error in register_face: {e}")
#         return error_response(f"Internal server error: {str(e)}", 500)

# # ==================== RECOGNIZE FACE ====================
# @api_bp.route('/face/recognize', methods=['POST'])
# def recognize_face():
#     try:
#         threshold = request.form.get('threshold') or (float(request.json.get('threshold')) if request.is_json and request.json.get('threshold') else 60.0)

#         image = None
#         if 'image' in request.files:
#             file = request.files['image']
#             image_bytes = file.read()
#             image = image_processor.load_image_from_bytes(image_bytes)
#         elif request.is_json and 'image' in request.json:
#             base64_string = request.json['image']
#             image = image_processor.load_image_from_base64(base64_string)

#         if image is None:
#             return error_response("Invalid image or no image provided", 400)

#         student_id, confidence, message = face_model.recognize_face(image)
#         if student_id is None or confidence < threshold:
#             return error_response(
#                 message if student_id is None else f"Confidence too low: {confidence:.2f}%",
#                 404,
#                 {'confidence': confidence}
#             )

#         return success_response({
#             'student_id': student_id,
#             'confidence': round(confidence, 2),
#             'threshold': threshold
#         }, message)

#     except Exception as e:
#         print(f"Error in recognize_face: {e}")
#         return error_response(f"Internal server error: {str(e)}", 500)

# # ==================== VERIFY FACE ====================
# @api_bp.route('/face/verify', methods=['POST'])
# def verify_face():
#     try:
#         student_id = request.form.get('student_id') or (request.json.get('student_id') if request.is_json else None)
#         if not student_id:
#             return error_response("student_id is required", 400)

#         image = None
#         if 'image' in request.files:
#             file = request.files['image']
#             image_bytes = file.read()
#             image = image_processor.load_image_from_bytes(image_bytes)
#         elif request.is_json and 'image' in request.json:
#             base64_string = request.json['image']
#             image = image_processor.load_image_from_base64(base64_string)

#         if image is None:
#             return error_response("Invalid image or no image provided", 400)

#         is_match, confidence, message = face_model.verify_face(student_id, image)

#         # Convert to native bool to avoid JSON serialization error
#         is_match = bool(is_match)

#         return success_response({
#             'student_id': student_id,
#             'is_match': is_match,
#             'confidence': round(confidence, 2)
#         }, message)

#     except Exception as e:
#         print(f"Error in verify_face: {e}")
#         return error_response(f"Internal server error: {str(e)}", 500)

# # ==================== GET ALL REGISTERED STUDENTS ====================
# @api_bp.route('/face/registered', methods=['GET'])
# def get_registered_students():
#     try:
#         students = face_model.get_all_registered_students()
#         return success_response({
#             'total': len(students),
#             'students': students
#         }, f"Found {len(students)} registered students")
#     except Exception as e:
#         print(f"Error in get_registered_students: {e}")
#         return error_response(f"Internal server error: {str(e)}", 500)

# # ==================== STATISTICS ====================
# @api_bp.route('/statistics', methods=['GET'])
# def get_statistics():
#     try:
#         stats = face_model.get_statistics()
#         return success_response(stats, "Statistics retrieved")
#     except Exception as e:
#         print(f"Error in get_statistics: {e}")
#         return error_response(f"Internal server error: {str(e)}", 500)

# # ==================== DELETE FACE ====================
# @api_bp.route('/face/delete/<student_id>', methods=['DELETE'])
# def delete_face(student_id):
#     try:
#         success, message = face_model.delete_face(student_id)
#         if not success:
#             return error_response(message, 404)
#         return success_response({'student_id': student_id}, message)
#     except Exception as e:
#         print(f"Error in delete_face: {e}")
#         return error_response(f"Internal server error: {str(e)}", 500)




# api/routes.py
import os
import io
import json
import time
from datetime import datetime, timedelta
from threading import Lock

from flask import request, jsonify, current_app
from . import api_bp

from config import Config
from models.face_recognition_model import FaceRecognitionModel
from utils.image_processing import ImageProcessor
from utils.face_detector import FaceDetector

# Optional mongodb
try:
    from pymongo import MongoClient
    MONGO_AVAILABLE = True
except Exception:
    MONGO_AVAILABLE = False

# Khởi tạo model + utils (shared)
face_model = FaceRecognitionModel()
image_processor = ImageProcessor()
face_detector = FaceDetector()

# Attendance storage: try Mongo, else file fallback
_mongo_client = None
_attendance_collection = None
_storage_lock = Lock()
JSON_DB_PATH = os.path.join(Config.TEMP_PATH, 'attendance_records.json')
os.makedirs(Config.TEMP_PATH, exist_ok=True)

if MONGO_AVAILABLE:
    try:
        _mongo_client = MongoClient(Config.MONGODB_URI, serverSelectionTimeoutMS=2000)
        # trigger server selection to raise early if cannot connect
        _mongo_client.server_info()
        db = _mongo_client.get_default_database()
        _attendance_collection = db.get_collection('attendance_records')
        current_app = None  # used only to avoid lint warnings in environments without Flask app context
        print("✅ Connected to MongoDB for attendance storage")
    except Exception as e:
        print(f"⚠️ MongoDB unavailable, using JSON fallback ({e})")
        _mongo_client = None
        _attendance_collection = None
else:
    print("⚠️ pymongo not installed - using JSON fallback for attendance storage")

# ----------------- Helpers -----------------
def success_response(data=None, message="Success", status=200):
    return jsonify({'success': True, 'message': message, 'data': data}), status

def error_response(message="Error", status=400, data=None):
    return jsonify({'success': False, 'message': message, 'data': data}), status

def _save_attendance_records_to_file(records):
    with _storage_lock:
        try:
            with open(JSON_DB_PATH, 'w', encoding='utf-8') as f:
                json.dump(records, f, ensure_ascii=False, indent=2, default=str)
            return True
        except Exception as e:
            print(f"Error saving attendance JSON: {e}")
            return False

def _load_attendance_records_from_file():
    with _storage_lock:
        if not os.path.exists(JSON_DB_PATH):
            return []
        try:
            with open(JSON_DB_PATH, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading attendance JSON: {e}")
            return []

def _store_attendance(record):
    """Store a single attendance record (dict). Tries Mongo, fallback to JSON file."""
    record_copy = record.copy()
    record_copy['created_at'] = record_copy.get('created_at', datetime.utcnow().isoformat())
    if _attendance_collection is not None:
        try:
            _attendance_collection.insert_one(record_copy)
            return True
        except Exception as e:
            print(f"Mongo insert failed: {e}")
            # fallthrough to file
    # file fallback
    records = _load_attendance_records_from_file()
    records.append(record_copy)
    return _save_attendance_records_to_file(records)

def _query_attendance(filters):
    """Query attendance records from Mongo or JSON file with simple filtering.
       filters: dict with optional keys: student_id, classroom_id, from_ts, to_ts
    """
    _from = filters.get('from_ts')
    _to = filters.get('to_ts')
    student_id = filters.get('student_id')
    classroom_id = filters.get('classroom_id')

    results = []
    if _attendance_collection is not None:
        q = {}
        if student_id:
            q['student_id'] = student_id
        if classroom_id:
            q['classroom_id'] = classroom_id
        if _from or _to:
            q['created_at'] = {}
            if _from:
                q['created_at']['$gte'] = _from
            if _to:
                q['created_at']['$lte'] = _to
        try:
            cursor = _attendance_collection.find(q).sort('created_at', -1)
            for doc in cursor:
                doc['_id'] = str(doc.get('_id'))
                results.append(doc)
            return results
        except Exception as e:
            print(f"Mongo query failed: {e}")
            # fallback to file

    records = _load_attendance_records_from_file()
    for r in reversed(records):  # newest first
        try:
            created = datetime.fromisoformat(r.get('created_at'))
        except Exception:
            created = None
        if student_id and r.get('student_id') != student_id:
            continue
        if classroom_id and r.get('classroom_id') != classroom_id:
            continue
        if _from and created and created < _from:
            continue
        if _to and created and created > _to:
            continue
        results.append(r)
    return results

# ----------------- Endpoints -----------------

@api_bp.route('/attendance/mark', methods=['POST'])
def attendance_mark():
    """
    Ghi nhận điểm danh từ 1 ảnh (file hoặc base64).
    Payload:
      - classroom_id (optional)
      - timestamp (optional, ISO string)
      - image: multipart file 'image' or JSON {'image': base64}
    Response: list of recognized students with confidence and stored records
    """
    try:
        classroom_id = request.form.get('classroom_id') or (request.json.get('classroom_id') if request.is_json else None)
        timestamp = request.form.get('timestamp') or (request.json.get('timestamp') if request.is_json else None)
        if timestamp:
            try:
                ts = datetime.fromisoformat(timestamp)
            except Exception:
                ts = datetime.utcnow()
        else:
            ts = datetime.utcnow()

        image = None
        # accept file or base64
        if 'image' in request.files:
            f = request.files['image']
            image = image_processor.load_image_from_bytes(f.read())
        elif request.is_json and 'image' in request.json:
            image = image_processor.load_image_from_base64(request.json['image'])

        if image is None:
            return error_response("No valid image provided", 400)

        # preprocess and recognize multiple faces
        processed = image_processor.preprocess_for_recognition(image)
        results, msg = face_model.recognize_multiple_faces(processed)
        stored = []
        for r in results:
            student_id = r.get('student_id')
            confidence = r.get('confidence', 0)
            # Only store recognized (non-None) with reasonable confidence
            if student_id is None:
                continue
            record = {
                'student_id': student_id,
                'classroom_id': classroom_id,
                'confidence': float(confidence),
                'meta': {
                    'distance': r.get('distance'),
                    'face_location': r.get('face_location')
                },
                'created_at': ts.isoformat()
            }
            ok = _store_attendance(record)
            if ok:
                stored.append(record)
        return success_response({'recognized': results, 'stored': stored}, f"Attendance processed. {len(stored)} records stored")
    except Exception as e:
        print(f"Error in attendance_mark: {e}")
        return error_response(f"Internal server error: {str(e)}", 500)

@api_bp.route('/attendance/stats', methods=['GET'])
def attendance_stats():
    """
    Lấy thống kê điểm danh.
    Query params: student_id, classroom_id, from (ISO), to (ISO)
    """
    try:
        student_id = request.args.get('student_id')
        classroom_id = request.args.get('classroom_id')
        from_s = request.args.get('from')
        to_s = request.args.get('to')

        from_ts = None
        to_ts = None
        if from_s:
            try:
                from_ts = datetime.fromisoformat(from_s)
            except Exception:
                from_ts = None
        if to_s:
            try:
                to_ts = datetime.fromisoformat(to_s)
            except Exception:
                to_ts = None

        filters = {'student_id': student_id, 'classroom_id': classroom_id, 'from_ts': from_ts, 'to_ts': to_ts}
        records = _query_attendance(filters)
        total = len(records)

        # simple aggregation example
        by_student = {}
        for r in records:
            sid = r.get('student_id')
            by_student.setdefault(sid, 0)
            by_student[sid] += 1

        return success_response({
            'total_records': total,
            'records': records,
            'by_student': by_student
        }, "Attendance stats retrieved")
    except Exception as e:
        print(f"Error in attendance_stats: {e}")
        return error_response(f"Internal server error: {str(e)}", 500)

@api_bp.route('/fraud/detect', methods=['POST'])
def fraud_detect():
    """
    Heuristic fraud detection for single image:
      - checks multiple faces
      - blur score and brightness (via FaceDetector.is_face_clear)
      - if blur too low -> suspicious (possible printed photo)
    Returns indicators for UI/alerting.
    """
    try:
        image = None
        if 'image' in request.files:
            f = request.files['image']
            image = image_processor.load_image_from_bytes(f.read())
        elif request.is_json and 'image' in request.json:
            image = image_processor.load_image_from_base64(request.json['image'])
        else:
            return error_response("No image provided", 400)

        if image is None:
            return error_response("Invalid image", 400)

        processed = image_processor.preprocess_for_recognition(image)
        face_locations = face_detector.detect_faces(processed)
        indicators = {
            'faces_detected': len(face_locations),
            'multiple_faces': len(face_locations) > 1
        }
        if len(face_locations) == 0:
            indicators['result'] = 'no_face'
            return success_response(indicators, "No faces detected")

        # check first face
        fl = face_locations[0]
        is_clear, metrics = face_detector.is_face_clear(processed, fl)
        indicators.update(metrics)

        # apply heuristic rules
        suspicious_reasons = []
        # printed photo heuristic: extremely low blur_score (very sharp) OR extremely high blur (very out-of-focus)
        if metrics['blur_score'] < 30:
            suspicious_reasons.append('low_blur_score_possible_printed_photo')
        if not metrics['is_bright_enough']:
            suspicious_reasons.append('bad_brightness')
        if indicators['multiple_faces']:
            suspicious_reasons.append('multiple_faces_in_frame')

        indicators['suspicious'] = len(suspicious_reasons) > 0
        indicators['suspicious_reasons'] = suspicious_reasons

        return success_response(indicators, "Fraud check completed")
    except Exception as e:
        print(f"Error in fraud_detect: {e}")
        return error_response(f"Internal server error: {str(e)}", 500)

@api_bp.route('/stream/recognize', methods=['POST'])
def stream_recognize():
    """
    Upload a video file (e.g., mp4) and run recognition every N frames.
    Params:
      - file field 'video' (multipart)
      - every_n_frames (optional, default 15)
      - classroom_id (optional)
    Response: summary of recognized ids with counts and sample confidences.
    """
    try:
        if 'video' not in request.files:
            return error_response("No video file provided", 400)
        video_file = request.files['video']
        every_n = int(request.form.get('every_n_frames', 15))
        classroom_id = request.form.get('classroom_id')

        # save temporarily to disk (cv2.VideoCapture works with path or bytes depending on build)
        tmp_path = os.path.join(Config.TEMP_PATH, f"upload_{int(time.time())}.mp4")
        video_file.save(tmp_path)

        import cv2 as _cv2

        cap = _cv2.VideoCapture(tmp_path)
        frame_count = int(cap.get(_cv2.CAP_PROP_FRAME_COUNT) or 0)
        fps = cap.get(_cv2.CAP_PROP_FPS) or 0
        processed_frames = 0
        recognized_summary = {}  # student_id -> {count, confidences}

        idx = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            idx += 1
            if idx % every_n != 0:
                continue
            # frame is BGR; convert to RGB
            frame_rgb = _cv2.cvtColor(frame, _cv2.COLOR_BGR2RGB)
            processed = image_processor.preprocess_for_recognition(frame_rgb)
            results, msg = face_model.recognize_multiple_faces(processed)
            for r in results:
                sid = r.get('student_id')
                conf = r.get('confidence', 0)
                if sid:
                    entry = recognized_summary.setdefault(sid, {'count': 0, 'confidences': []})
                    entry['count'] += 1
                    entry['confidences'].append(float(conf))
            processed_frames += 1

        cap.release()
        try:
            os.remove(tmp_path)
        except Exception:
            pass

        # Build response
        resp = []
        for sid, info in recognized_summary.items():
            resp.append({
                'student_id': sid,
                'count': info['count'],
                'avg_confidence': sum(info['confidences']) / len(info['confidences'])
            })
        meta = {'frames_scanned': processed_frames, 'video_frames': frame_count, 'fps': fps}
        return success_response({'summary': resp, 'meta': meta}, "Video processed")
    except Exception as e:
        print(f"Error in stream_recognize: {e}")
        return error_response(f"Internal server error: {str(e)}", 500)
