# Hướng dẫn Deploy Web API Điểm Danh Sinh Viên

## Tổng quan
Hệ thống điểm danh sinh viên bao gồm:
- **Backend API** (Node.js/Express) - Chạy trên port 5000
- **AI Service** (Python/Flask) - Chạy trên port 5001
- **MongoDB** - Database (sử dụng MongoDB Atlas)

## Phương pháp Deploy

### 1. Chuẩn bị môi trường Production

#### Cập nhật file .env cho Production

**backend/.env:**
```env
NODE_ENV=production
PORT=5000
ALLOWED_ORIGINS=https://yourdomain.com

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# JWT Configuration
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=1h
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_REFRESH_EXPIRE=30d

# Python AI Service
AI_SERVICE_URL=http://localhost:5001
API_SECRET_KEY=your_api_secret

# Cloudinary (nếu sử dụng)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# SMTP Email (nếu sử dụng)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# File Upload
MAX_FILE_SIZE=5242880
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/jpg
```

**ai-service/.env:**
```env
FLASK_ENV=production
FLASK_DEBUG=False
FLASK_HOST=0.0.0.0
FLASK_PORT=5001

ENCODINGS_PATH=./data/encodings
TEMP_PATH=./data/temp
UPLOAD_FOLDER=./uploads

FACE_DETECTION_MODEL=hog
FACE_RECOGNITION_TOLERANCE=0.6
NUM_JITTERS=1

API_SECRET_KEY=your_api_secret
ALLOWED_ORIGINS=https://yourdomain.com
BACKEND_URL=http://localhost:5000

MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

MAX_IMAGE_SIZE=5242880
ALLOWED_EXTENSIONS=jpg,jpeg,png
IMAGE_QUALITY=95
MAX_WORKERS=4
BATCH_SIZE=10
```

### 2. Deploy bằng Docker (Khuyến nghị)

#### Tạo docker-compose.yml cho toàn hệ thống
```yaml
version: '3.8'

services:
  backend:
    build:
      context: ../backend
      dockerfile: Dockerfile
    container_name: attendance-backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
    env_file:
      - ../backend/.env
    depends_on:
      - ai-service
    networks:
      - app-network

  ai-service:
    build:
      context: ../ai-service
      dockerfile: Dockerfile
    container_name: face-recognition-ai
    ports:
      - "5001:5001"
    volumes:
      - ../ai-service/data:/app/data
      - ../ai-service/uploads:/app/uploads
    environment:
      - FLASK_ENV=production
      - FLASK_DEBUG=False
    env_file:
      - ../ai-service/.env
    restart: unless-stopped
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

#### Tạo Dockerfile cho Backend
```dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads/faces uploads/temp

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Run application
CMD ["npm", "start"]
```

### 3. Deploy lên Server (Linux/Ubuntu)

#### Cài đặt Node.js và PM2
```bash
# Cài đặt Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Cài đặt PM2
sudo npm install -g pm2

# Cài đặt Docker và Docker Compose
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
```

#### Deploy từng service

**Deploy Backend:**
```bash
cd backend
npm install --production
pm2 start server.js --name "attendance-backend"
pm2 startup
pm2 save
```

**Deploy AI Service:**
```bash
cd ai-service
docker-compose up -d --build
```

#### Cấu hình Nginx (Reverse Proxy)
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /ai/ {
        proxy_pass http://localhost:5001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. Deploy lên Cloud Platforms

#### Heroku
```bash
# Backend
cd backend
heroku create your-backend-app
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your_mongodb_uri
# Deploy
git push heroku main

# AI Service (không hỗ trợ trực tiếp Python ML, nên dùng Railway hoặc Render)
```

#### Railway
```bash
# Tạo project mới cho Backend và AI Service
railway init
railway up
```

### 5. Chạy Local Production

```bash
# Terminal 1: Backend
cd backend
npm install
npm start

# Terminal 2: AI Service
cd ai-service
docker-compose up --build
```

### 6. Monitoring và Logs

#### PM2 Monitoring
```bash
pm2 monit
pm2 logs attendance-backend
```

#### Docker Logs
```bash
docker-compose logs -f ai-service
```

### 7. Backup Database
```bash
# MongoDB Atlas tự động backup
# Hoặc sử dụng mongodump
mongodump --uri="mongodb+srv://username:password@cluster.mongodb.net/dbname" --out=/path/to/backup
```

### 8. Cập nhật và Maintenance
```bash
# Restart services
pm2 restart attendance-backend
docker-compose restart ai-service

# Update code
git pull origin main
npm install
pm2 restart all
docker-compose up -d --build
```

## Lưu ý Quan trọng

1. **Security**: Thay đổi tất cả secret keys trong production
2. **Environment Variables**: Không commit file .env vào Git
3. **Database**: Sử dụng MongoDB Atlas cho production
4. **SSL**: Cấu hình HTTPS với Let's Encrypt
5. **Monitoring**: Thiết lập monitoring và alerting
6. **Backup**: Định kỳ backup database và uploads
7. **Scaling**: Sử dụng load balancer khi traffic cao

## Troubleshooting

- Kiểm tra logs: `pm2 logs` và `docker-compose logs`
- Kiểm tra health endpoints
- Verify environment variables
- Test API endpoints với Postman