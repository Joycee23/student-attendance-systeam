import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Cấu hình chung cho AI Service"""
    
    # Flask
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'True') == 'True'
    FLASK_HOST = os.getenv('FLASK_HOST', '0.0.0.0')
    FLASK_PORT = int(os.getenv('FLASK_PORT', 5001))
    
    # Security
    SECRET_KEY = os.getenv('API_SECRET_KEY', 'dev-secret-key')
    ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', '*').split(',')
    
    # Paths
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    ENCODINGS_PATH = os.path.join(BASE_DIR, 'data', 'encodings')
    TEMP_PATH = os.path.join(BASE_DIR, 'data', 'temp')
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
    
    # Face Recognition
    FACE_DETECTION_MODEL = os.getenv('FACE_DETECTION_MODEL', 'hog')
    FACE_RECOGNITION_TOLERANCE = float(os.getenv('FACE_RECOGNITION_TOLERANCE', 0.6))
    NUM_JITTERS = int(os.getenv('NUM_JITTERS', 1))
    
    # Backend
    BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:4000')
    
    # MongoDB
    MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/attendance_system')
    
    # Image Processing
    MAX_IMAGE_SIZE = int(os.getenv('MAX_IMAGE_SIZE', 5242880))
    ALLOWED_EXTENSIONS = set(os.getenv('ALLOWED_EXTENSIONS', 'jpg,jpeg,png').split(','))
    IMAGE_QUALITY = int(os.getenv('IMAGE_QUALITY', 95))
    
    # Performance
    MAX_WORKERS = int(os.getenv('MAX_WORKERS', 4))
    BATCH_SIZE = int(os.getenv('BATCH_SIZE', 10))
    
    @staticmethod
    def init_app():
        """Khởi tạo thư mục cần thiết"""
        os.makedirs(Config.ENCODINGS_PATH, exist_ok=True)
        os.makedirs(Config.TEMP_PATH, exist_ok=True)
        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
        print(f"✅ Initialized directories:")
        print(f"   - Encodings: {Config.ENCODINGS_PATH}")
        print(f"   - Temp: {Config.TEMP_PATH}")
        print(f"   - Uploads: {Config.UPLOAD_FOLDER}")