from flask import request, jsonify
from . import api_bp
from models.face_recognition_model import FaceRecognitionModel
from utils.image_processing import ImageProcessor
import os
import time
from werkzeug.utils import secure_filename
from config import Config

# Khởi tạo model
face_model = FaceRecognitionModel()
image_processor = ImageProcessor()

# Helper function
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS

def success_response(data=None, message="Success", status=200):
    response = {
        'success': True,
        'message': message,
        'data': data
    }
    return jsonify(response), status

def error_response(message="Error", status=400, data=None):
    response = {
        'success': False,
        'message': message,
        'data': data
    }
    return jsonify(response), status

# ==================== HEALTH CHECK ====================
@api_bp.route('/health', methods=['GET'])
def health_check():
    return success_response({
        'status': 'healthy',
        'timestamp': time.time(),
        'registered_faces': len(face_model.known_ids)
    }, "AI Service is running")

# ==================== REGISTER FACE ====================
@api_bp.route('/face/register', methods=['POST'])
def register_face():
    try:
        student_id = request.form.get('student_id') or (request.json.get('student_id') if request.is_json else None)
        if not student_id:
            return error_response("student_id is required", 400)

        image = None
        if 'image' in request.files:
            file = request.files['image']
            if file.filename == '':
                return error_response("No file selected", 400)
            is_valid, msg = image_processor.validate_image(file)
            if not is_valid:
                return error_response(msg, 400)
            image_bytes = file.read()
            image = image_processor.load_image_from_bytes(image_bytes)
        elif request.is_json and 'image' in request.json:
            base64_string = request.json['image']
            image = image_processor.load_image_from_base64(base64_string)

        if image is None:
            return error_response("Invalid image or no image provided", 400)

        success, message, encoding = face_model.register_face(student_id, image)
        if not success:
            return error_response(message, 400)

        return success_response({
            'student_id': student_id,
            'encoding_length': len(encoding) if encoding else 0
        }, message, 201)

    except Exception as e:
        print(f"Error in register_face: {e}")
        return error_response(f"Internal server error: {str(e)}", 500)

# ==================== RECOGNIZE FACE ====================
@api_bp.route('/face/recognize', methods=['POST'])
def recognize_face():
    try:
        threshold = request.form.get('threshold') or (float(request.json.get('threshold')) if request.is_json and request.json.get('threshold') else 60.0)

        image = None
        if 'image' in request.files:
            file = request.files['image']
            image_bytes = file.read()
            image = image_processor.load_image_from_bytes(image_bytes)
        elif request.is_json and 'image' in request.json:
            base64_string = request.json['image']
            image = image_processor.load_image_from_base64(base64_string)

        if image is None:
            return error_response("Invalid image or no image provided", 400)

        student_id, confidence, message = face_model.recognize_face(image)
        if student_id is None or confidence < threshold:
            return error_response(
                message if student_id is None else f"Confidence too low: {confidence:.2f}%",
                404,
                {'confidence': confidence}
            )

        return success_response({
            'student_id': student_id,
            'confidence': round(confidence, 2),
            'threshold': threshold
        }, message)

    except Exception as e:
        print(f"Error in recognize_face: {e}")
        return error_response(f"Internal server error: {str(e)}", 500)

# ==================== VERIFY FACE ====================
@api_bp.route('/face/verify', methods=['POST'])
def verify_face():
    try:
        student_id = request.form.get('student_id') or (request.json.get('student_id') if request.is_json else None)
        if not student_id:
            return error_response("student_id is required", 400)

        image = None
        if 'image' in request.files:
            file = request.files['image']
            image_bytes = file.read()
            image = image_processor.load_image_from_bytes(image_bytes)
        elif request.is_json and 'image' in request.json:
            base64_string = request.json['image']
            image = image_processor.load_image_from_base64(base64_string)

        if image is None:
            return error_response("Invalid image or no image provided", 400)

        is_match, confidence, message = face_model.verify_face(student_id, image)

        # Convert to native bool to avoid JSON serialization error
        is_match = bool(is_match)

        return success_response({
            'student_id': student_id,
            'is_match': is_match,
            'confidence': round(confidence, 2)
        }, message)

    except Exception as e:
        print(f"Error in verify_face: {e}")
        return error_response(f"Internal server error: {str(e)}", 500)

# ==================== GET ALL REGISTERED STUDENTS ====================
@api_bp.route('/face/registered', methods=['GET'])
def get_registered_students():
    try:
        students = face_model.get_all_registered_students()
        return success_response({
            'total': len(students),
            'students': students
        }, f"Found {len(students)} registered students")
    except Exception as e:
        print(f"Error in get_registered_students: {e}")
        return error_response(f"Internal server error: {str(e)}", 500)

# ==================== STATISTICS ====================
@api_bp.route('/statistics', methods=['GET'])
def get_statistics():
    try:
        stats = face_model.get_statistics()
        return success_response(stats, "Statistics retrieved")
    except Exception as e:
        print(f"Error in get_statistics: {e}")
        return error_response(f"Internal server error: {str(e)}", 500)

# ==================== DELETE FACE ====================
@api_bp.route('/face/delete/<student_id>', methods=['DELETE'])
def delete_face(student_id):
    try:
        success, message = face_model.delete_face(student_id)
        if not success:
            return error_response(message, 404)
        return success_response({'student_id': student_id}, message)
    except Exception as e:
        print(f"Error in delete_face: {e}")
        return error_response(f"Internal server error: {str(e)}", 500)
