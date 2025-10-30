# Configuración de entorno para Grow Labs Races

# Base de datos
DATABASE_URL = "sqlite:///./database/runners.db"

# Configuración de la API
API_HOST = "0.0.0.0"
API_PORT = 8000
API_RELOAD = True

# Configuración de CORS
CORS_ORIGINS = [
    "http://localhost:5173",  # Vite por defecto
    "http://localhost:3000",  # React por defecto
]

# Configuración de archivos
UPLOAD_MAX_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".bmp", ".tiff"]

# Configuración de YOLOv8
MODEL_CONFIDENCE_THRESHOLD = 0.5
MODEL_IOU_THRESHOLD = 0.45

# Configuración de OCR
TESSERACT_CONFIG = "--oem 3 --psm 6 -c tessedit_char_whitelist=0123456789"
