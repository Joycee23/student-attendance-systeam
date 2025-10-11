import cv2
import numpy as np
from PIL import Image
import io
import base64
from config import Config

class ImageProcessor:
    """Xử lý và tiền xử lý ảnh"""
    
    @staticmethod
    def validate_image(file):
        """Kiểm tra file ảnh hợp lệ"""
        if not file:
            return False, "No file provided"
        
        filename = file.filename.lower()
        if not any(filename.endswith(ext) for ext in Config.ALLOWED_EXTENSIONS):
            return False, f"Invalid file type. Allowed: {Config.ALLOWED_EXTENSIONS}"
        
        return True, "Valid"
    
    @staticmethod
    def load_image_from_file(file_path):
        """Đọc ảnh từ file"""
        try:
            image = cv2.imread(file_path)
            if image is None:
                return None
            return cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        except Exception as e:
            print(f"Error loading image: {e}")
            return None
    
    @staticmethod
    def load_image_from_bytes(image_bytes):
        """Đọc ảnh từ bytes"""
        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            return cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        except Exception as e:
            print(f"Error loading image from bytes: {e}")
            return None
    
    @staticmethod
    def load_image_from_base64(base64_string):
        """Đọc ảnh từ base64"""
        try:
            # Xóa header nếu có
            if ',' in base64_string:
                base64_string = base64_string.split(',')[1]
            
            image_bytes = base64.b64decode(base64_string)
            return ImageProcessor.load_image_from_bytes(image_bytes)
        except Exception as e:
            print(f"Error loading image from base64: {e}")
            return None
    
    @staticmethod
    def resize_image(image, max_width=800, max_height=800):
        """Resize ảnh giữ nguyên tỷ lệ"""
        height, width = image.shape[:2]
        
        if width <= max_width and height <= max_height:
            return image
        
        ratio = min(max_width / width, max_height / height)
        new_width = int(width * ratio)
        new_height = int(height * ratio)
        
        return cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_AREA)
    
    @staticmethod
    def enhance_image(image):
        """Cải thiện chất lượng ảnh"""
        # Chuyển sang LAB color space
        lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
        l, a, b = cv2.split(lab)
        
        # Áp dụng CLAHE (Contrast Limited Adaptive Histogram Equalization)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        l = clahe.apply(l)
        
        # Merge lại
        enhanced_lab = cv2.merge([l, a, b])
        enhanced_image = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2RGB)
        
        return enhanced_image
    
    @staticmethod
    def denoise_image(image):
        """Giảm nhiễu ảnh"""
        return cv2.fastNlMeansDenoisingColored(image, None, 10, 10, 7, 21)
    
    @staticmethod
    def detect_and_align_face(image):
        """Phát hiện và căn chỉnh khuôn mặt"""
        face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)
        
        if len(faces) == 0:
            return None
        
        # Lấy khuôn mặt lớn nhất
        largest_face = max(faces, key=lambda rect: rect[2] * rect[3])
        x, y, w, h = largest_face
        
        # Mở rộng vùng khuôn mặt 20%
        padding = int(w * 0.2)
        x = max(0, x - padding)
        y = max(0, y - padding)
        w = min(image.shape[1] - x, w + 2 * padding)
        h = min(image.shape[0] - y, h + 2 * padding)
        
        face_image = image[y:y+h, x:x+w]
        return face_image
    
    @staticmethod
    def preprocess_for_recognition(image):
        """Tiền xử lý ảnh cho nhận diện"""
        # Resize
        processed = ImageProcessor.resize_image(image)
        
        # Enhance
        processed = ImageProcessor.enhance_image(processed)
        
        # Denoise (tùy chọn)
        # processed = ImageProcessor.denoise_image(processed)
        
        return processed
    
    @staticmethod
    def image_to_base64(image):
        """Chuyển ảnh sang base64"""
        _, buffer = cv2.imencode('.jpg', cv2.cvtColor(image, cv2.COLOR_RGB2BGR))
        return base64.b64encode(buffer).decode('utf-8')
    
    @staticmethod
    def save_image(image, file_path, quality=95):
        """Lưu ảnh"""
        try:
            bgr_image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
            cv2.imwrite(file_path, bgr_image, [cv2.IMWRITE_JPEG_QUALITY, quality])
            return True
        except Exception as e:
            print(f"Error saving image: {e}")
            return False