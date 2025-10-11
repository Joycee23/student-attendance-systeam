from flask import Blueprint

# Khởi tạo blueprint trước
api_bp = Blueprint('api', __name__)

# Import routes SAU KHI khởi tạo blueprint
import api.routes
