import pickle
import os
import numpy as np
from datetime import datetime
from config import Config
from utils.face_detector import FaceDetector
from utils.image_processing import ImageProcessor

class FaceRecognitionModel:
    """Model quản lý và nhận diện khuôn mặt"""
    
    def __init__(self):
        self.face_detector = FaceDetector()
        self.image_processor = ImageProcessor()
        self.encodings_file = os.path.join(Config.ENCODINGS_PATH, 'face_encodings.pkl')
        self.known_encodings = []
        self.known_ids = []
        self.load_encodings()
    
    def load_encodings(self):
        """Load face encodings từ file"""
        if os.path.exists(self.encodings_file):
            try:
                with open(self.encodings_file, 'rb') as f:
                    data = pickle.load(f)
                    self.known_encodings = data.get('encodings', [])
                    self.known_ids = data.get('ids', [])
                print(f"✅ Loaded {len(self.known_encodings)} face encodings")
            except Exception as e:
                print(f"❌ Error loading encodings: {e}")
                self.known_encodings = []
                self.known_ids = []
        else:
            print("ℹ️ No encodings file found. Starting fresh.")
            self.known_encodings = []
            self.known_ids = []
    
    def save_encodings(self):
        """Lưu face encodings vào file"""
        try:
            data = {
                'encodings': self.known_encodings,
                'ids': self.known_ids,
                'last_updated': datetime.now().isoformat()
            }
            with open(self.encodings_file, 'wb') as f:
                pickle.dump(data, f)
            print(f"✅ Saved {len(self.known_encodings)} face encodings")
            return True
        except Exception as e:
            print(f"❌ Error saving encodings: {e}")
            return False
    
    def register_face(self, student_id, image):
        """
        Đăng ký khuôn mặt mới
        Returns: (success, message, encoding)
        """
        # Tiền xử lý ảnh
        processed_image = self.image_processor.preprocess_for_recognition(image)
        
        # Lấy encoding
        encoding, message = self.face_detector.get_single_face_encoding(processed_image)
        
        if encoding is None:
            return False, message, None
        
        # Kiểm tra xem student_id đã tồn tại chưa
        if student_id in self.known_ids:
            # Cập nhật encoding cũ
            idx = self.known_ids.index(student_id)
            self.known_encodings[idx] = encoding
            message = f"Updated face encoding for student {student_id}"
        else:
            # Thêm encoding mới
            self.known_encodings.append(encoding)
            self.known_ids.append(student_id)
            message = f"Registered new face for student {student_id}"
        
        # Lưu vào file
        self.save_encodings()
        
        return True, message, encoding.tolist()
    
    def recognize_face(self, image):
        """
        Nhận diện khuôn mặt từ ảnh
        Returns: (student_id, confidence, message)
        """
        if len(self.known_encodings) == 0:
            return None, 0, "No registered faces in database"
        
        # Tiền xử lý ảnh
        processed_image = self.image_processor.preprocess_for_recognition(image)
        
        # Lấy encoding
        encoding, message = self.face_detector.get_single_face_encoding(processed_image)
        
        if encoding is None:
            return None, 0, message
        
        # Tìm khuôn mặt khớp nhất
        student_id, distance, confidence = self.face_detector.find_best_match(
            encoding,
            self.known_encodings,
            self.known_ids
        )
        
        if student_id is None:
            return None, 0, "No matching face found"
        
        return student_id, confidence, f"Recognized student {student_id}"
    
    def recognize_multiple_faces(self, image):
        """
        Nhận diện nhiều khuôn mặt trong một ảnh
        Returns: list of (student_id, confidence, face_location)
        """
        if len(self.known_encodings) == 0:
            return [], "No registered faces in database"
        
        # Tiền xử lý ảnh
        processed_image = self.image_processor.preprocess_for_recognition(image)
        
        # Phát hiện tất cả khuôn mặt
        face_locations = self.face_detector.detect_faces(processed_image)
        
        if len(face_locations) == 0:
            return [], "No faces detected"
        
        # Lấy encodings của tất cả khuôn mặt
        face_encodings = self.face_detector.get_face_encodings(
            processed_image, 
            face_locations
        )
        
        results = []
        for i, encoding in enumerate(face_encodings):
            student_id, distance, confidence = self.face_detector.find_best_match(
                encoding,
                self.known_encodings,
                self.known_ids
            )
            
            results.append({
                'student_id': student_id,
                'confidence': confidence,
                'distance': distance,
                'face_location': face_locations[i]
            })
        
        return results, "Success"
    
    def verify_face(self, student_id, image):
        """
        Xác minh khuôn mặt có phải của student_id không
        Returns: (is_match, confidence, message)
        """
        if student_id not in self.known_ids:
            return False, 0, f"Student {student_id} not registered"
        
        # Lấy encoding đã lưu
        idx = self.known_ids.index(student_id)
        known_encoding = self.known_encodings[idx]
        
        # Tiền xử lý ảnh
        processed_image = self.image_processor.preprocess_for_recognition(image)
        
        # Lấy encoding từ ảnh mới
        encoding, message = self.face_detector.get_single_face_encoding(processed_image)
        
        if encoding is None:
            return False, 0, message
        
        # So sánh
        is_match, distance, confidence = self.face_detector.compare_faces(
            known_encoding,
            encoding
        )
        
        return is_match, confidence, "Match" if is_match else "No match"
    
    def delete_face(self, student_id):
        """
        Xóa encoding của student
        Returns: (success, message)
        """
        if student_id not in self.known_ids:
            return False, f"Student {student_id} not found"
        
        idx = self.known_ids.index(student_id)
        del self.known_encodings[idx]
        del self.known_ids[idx]
        
        self.save_encodings()
        
        return True, f"Deleted face encoding for student {student_id}"
    
    def get_all_registered_students(self):
        """Lấy danh sách tất cả sinh viên đã đăng ký"""
        return self.known_ids
    
    def get_statistics(self):
        """Lấy thống kê"""
        return {
            'total_registered': len(self.known_ids),
            'students': self.known_ids,
            'last_updated': datetime.now().isoformat()
        }
    
    def clear_all_encodings(self):
        """Xóa tất cả encodings (cẩn thận!)"""
        self.known_encodings = []
        self.known_ids = []
        self.save_encodings()
        return True, "All face encodings cleared"