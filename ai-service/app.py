from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from api import api_bp
import os

def create_app():
    """Factory pattern để tạo Flask app"""
    
    # Khởi tạo Flask app
    app = Flask(__name__)
    
    # Load config
    app.config.from_object(Config)
    
    # Khởi tạo thư mục cần thiết
    Config.init_app()
    
    # CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": Config.ALLOWED_ORIGINS,
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Register blueprints
    app.register_blueprint(api_bp)
    
    # Root endpoint
    @app.route('/')
    def index():
        return jsonify({
            'service': 'Face Recognition AI Service',
            'version': '1.0.0',
            'status': 'running',
            'endpoints': {
                'health': '/api/health',
                'register': '/api/face/register',
                'recognize': '/api/face/recognize',
                'recognize_multiple': '/api/face/recognize-multiple',
                'verify': '/api/face/verify',
                'delete': '/api/face/delete/<student_id>',
                'registered': '/api/face/registered',
                'statistics': '/api/statistics',
                'batch_register': '/api/face/batch-register'
            }
        })
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'success': False,
            'message': 'Endpoint not found',
            'error': str(error)
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            'success': False,
            'message': 'Internal server error',
            'error': str(error)
        }), 500
    
    @app.errorhandler(413)
    def request_entity_too_large(error):
        return jsonify({
            'success': False,
            'message': 'File too large',
            'error': str(error)
        }), 413
    
    return app

if __name__ == '__main__':
    app = create_app()
    
    print("=" * 60)
    print("🚀 Face Recognition AI Service")
    print("=" * 60)
    print(f"📍 Host: {Config.FLASK_HOST}")
    print(f"🔌 Port: {Config.FLASK_PORT}")
    print(f"🔧 Environment: {Config.FLASK_ENV}")
    print(f"📁 Encodings Path: {Config.ENCODINGS_PATH}")
    print("=" * 60)
    print("✅ Server is starting...")
    print("=" * 60)
    
    app.run(
        host=Config.FLASK_HOST,
        port=Config.FLASK_PORT,
        debug=Config.FLASK_DEBUG
    )