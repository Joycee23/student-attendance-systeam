import face_recognition
import cv2
import numpy as np
from config import Config

class FaceDetector:
    """Phát hiện và xử lý khuôn mặt"""
    
    def __init__(self):
        self.detection_model = Config.FACE_DETECTION_MODEL
    
    def detect_faces(self, image):
        """
        Phát hiện tất cả khuôn mặt trong ảnh
        Returns: list of face locations [(top, right, bottom, left), ...]
        """
        try:
            face_locations = face_recognition.face_locations(
                image, 
                model=self.detection_model
            )
            return face_locations
        except Exception as e:
            print(f"Error detecting faces: {e}")
            return []
    
    def detect_single_face(self, image):
        """
        Phát hiện một khuôn mặt duy nhất
        Returns: face_location hoặc None
        """
        face_locations = self.detect_faces(image)
        
        if len(face_locations) == 0:
            return None, "No face detected"
        
        if len(face_locations) > 1:
            return None, "Multiple faces detected. Please ensure only one face is visible"
        
        return face_locations[0], "Success"
    
    def get_face_encodings(self, image, face_locations=None, num_jitters=None):
        """
        Lấy face encodings từ ảnh
        num_jitters: số lần xử lý ảnh (càng cao càng chính xác)
        """
        if num_jitters is None:
            num_jitters = Config.NUM_JITTERS
        
        try:
            if face_locations is None:
                face_locations = self.detect_faces(image)
            
            if len(face_locations) == 0:
                return []
            
            encodings = face_recognition.face_encodings(
                image,
                known_face_locations=face_locations,
                num_jitters=num_jitters
            )
            
            return encodings
        except Exception as e:
            print(f"Error getting face encodings: {e}")
            return []
    
    def get_single_face_encoding(self, image):
        """
        Lấy encoding của một khuôn mặt duy nhất
        Returns: encoding hoặc None, message
        """
        face_location, message = self.detect_single_face(image)
        
        if face_location is None:
            return None, message
        
        encodings = self.get_face_encodings(image, [face_location])
        
        if len(encodings) == 0:
            return None, "Could not encode face"
        
        return encodings[0], "Success"
    
    def compare_faces(self, known_encoding, face_encoding, tolerance=None):
        """
        So sánh hai khuôn mặt
        Returns: (is_match, distance)
        """
        if tolerance is None:
            tolerance = Config.FACE_RECOGNITION_TOLERANCE
        
        try:
            # Tính khoảng cách
            distance = face_recognition.face_distance([known_encoding], face_encoding)[0]
            
            # So sánh
            is_match = distance <= tolerance
            
            # Tính độ tin cậy (0-100%)
            confidence = (1 - distance) * 100
            
            return is_match, float(distance), float(confidence)
        except Exception as e:
            print(f"Error comparing faces: {e}")
            return False, 1.0, 0.0
    
    def find_best_match(self, unknown_encoding, known_encodings, known_ids, tolerance=None):
        """
        Tìm khuôn mặt khớp nhất từ danh sách
        Returns: (student_id, distance, confidence) hoặc (None, None, None)
        """
        if tolerance is None:
            tolerance = Config.FACE_RECOGNITION_TOLERANCE
        
        if len(known_encodings) == 0:
            return None, None, None
        
        try:
            # Tính khoảng cách với tất cả khuôn mặt đã biết
            distances = face_recognition.face_distance(known_encodings, unknown_encoding)
            
            # Tìm khoảng cách nhỏ nhất
            min_distance_idx = np.argmin(distances)
            min_distance = distances[min_distance_idx]
            
            # Kiểm tra có khớp không
            if min_distance <= tolerance:
                confidence = (1 - min_distance) * 100
                return known_ids[min_distance_idx], float(min_distance), float(confidence)
            
            return None, None, None
        except Exception as e:
            print(f"Error finding best match: {e}")
            return None, None, None
    
    def draw_face_box(self, image, face_location, label=None, color=(0, 255, 0)):
        """
        Vẽ khung xung quanh khuôn mặt
        """
        top, right, bottom, left = face_location
        
        # Vẽ khung
        cv2.rectangle(image, (left, top), (right, bottom), color, 2)
        
        # Vẽ label nếu có
        if label:
            cv2.rectangle(image, (left, bottom - 35), (right, bottom), color, cv2.FILLED)
            cv2.putText(
                image, 
                label, 
                (left + 6, bottom - 6), 
                cv2.FONT_HERSHEY_DUPLEX, 
                0.6, 
                (255, 255, 255), 
                1
            )
        
        return image
    
    def get_face_landmarks(self, image, face_location=None):
        """
        Lấy các điểm đặc trưng trên khuôn mặt
        (mắt, mũi, miệng, etc.)
        """
        try:
            if face_location is None:
                face_locations = self.detect_faces(image)
                if len(face_locations) == 0:
                    return None
                face_location = face_locations[0]
            
            landmarks = face_recognition.face_landmarks(image, [face_location])
            return landmarks[0] if landmarks else None
        except Exception as e:
            print(f"Error getting face landmarks: {e}")
            return None
    
    def is_face_clear(self, image, face_location):
        """
        Kiểm tra khuôn mặt có rõ ràng không
        (không bị mờ, quá tối, quá sáng)
        """
        top, right, bottom, left = face_location
        face_image = image[top:bottom, left:right]
        
        # Kiểm tra độ mờ (Laplacian variance)
        gray = cv2.cvtColor(face_image, cv2.COLOR_RGB2GRAY)
        blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        # Kiểm tra độ sáng
        brightness = np.mean(gray)
        
        is_clear = blur_score > 100  # Ngưỡng độ mờ
        is_bright_enough = 30 < brightness < 225  # Ngưỡng độ sáng
        
        return is_clear and is_bright_enough, {
            'blur_score': float(blur_score),
            'brightness': float(brightness),
            'is_clear': is_clear,
            'is_bright_enough': is_bright_enough
        }