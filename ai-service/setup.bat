@echo off
echo Setting up AI Service structure...
echo.

REM Tao cac thu muc
mkdir api 2>nul
mkdir models 2>nul
mkdir utils 2>nul
mkdir data\encodings 2>nul
mkdir data\temp 2>nul
mkdir uploads 2>nul

REM Tao file .gitkeep
type nul > data\encodings\.gitkeep
type nul > data\temp\.gitkeep
type nul > uploads\.gitkeep

REM Tao file __init__.py
type nul > api\__init__.py
type nul > models\__init__.py
type nul > utils\__init__.py

echo Directory structure created!
echo.
echo Structure:
echo   ai-service/
echo   ├── api/
echo   │   ├── __init__.py
echo   │   └── routes.py
echo   ├── models/
echo   │   ├── __init__.py
echo   │   └── face_recognition_model.py
echo   ├── utils/
echo   │   ├── __init__.py
echo   │   ├── image_processing.py
echo   │   └── face_detector.py
echo   ├── data/
echo   │   ├── encodings/
echo   │   └── temp/
echo   ├── uploads/
echo   ├── app.py
echo   ├── config.py
echo   ├── .env
echo   ├── requirements.txt
echo   ├── .gitignore
echo   └── README.md
echo.
echo Next steps:
echo   1. Create virtual environment: python -m venv venv
echo   2. Activate it: venv\Scripts\activate
echo   3. Install dependencies: pip install -r requirements.txt
echo   4. Copy .env file and configure
echo   5. Run the service: python app.py
echo.
echo Done!
pause