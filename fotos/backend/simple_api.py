from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import cv2
import numpy as np
import pytesseract
import sqlite3
import re
from pathlib import Path

# Configuración básica
app = FastAPI(title="Grow Labs Races API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rutas
BASE_DIR = Path(__file__).parent
DATABASE_PATH = BASE_DIR.parent / "database" / "runners.db"

# Crear directorio de base de datos
DATABASE_PATH.parent.mkdir(exist_ok=True)

def init_db():
    """Inicializar base de datos"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS runners (
            id INTEGER PRIMARY KEY,
            plate_number TEXT UNIQUE,
            runner_name TEXT
        )
    ''')
    
    # Insertar datos de ejemplo
    cursor.execute('SELECT COUNT(*) FROM runners')
    if cursor.fetchone()[0] == 0:
        sample_data = [
            ('001', 'Juan Pérez'),
            ('002', 'María García'),
            ('003', 'Carlos López'),
            ('847', 'Roberto Silva'),
            ('123', 'Pedro Sánchez'),
            ('456', 'Laura Fernández'),
        ]
        cursor.executemany('INSERT INTO runners (plate_number, runner_name) VALUES (?, ?)', sample_data)
    
    conn.commit()
    conn.close()

def get_runner(plate_number):
    """Buscar corredor por número de placa"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT runner_name FROM runners WHERE plate_number = ?', (plate_number,))
    result = cursor.fetchone()
    conn.close()
    return result[0] if result else None

def extract_text(image):
    """Extraer texto de imagen"""
    try:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Probar diferentes configuraciones
        configs = [
            r'--oem 3 --psm 6 -c tessedit_char_whitelist=0123456789',
            r'--oem 3 --psm 8 -c tessedit_char_whitelist=0123456789',
            r'--oem 3 --psm 6',
        ]
        
        for config in configs:
            try:
                text = pytesseract.image_to_string(gray, config=config).strip()
                numbers = re.findall(r'\d+', text)
                clean_text = ''.join(numbers)
                if len(clean_text) >= 2 and len(clean_text) <= 4:
                    return clean_text
            except:
                continue
        return ""
    except:
        return ""

@app.on_event("startup")
async def startup():
    print("[STARTUP] Iniciando API...")
    init_db()
    print("[OK] API lista!")

@app.get("/")
async def root():
    return {"message": "Grow Labs Races API"}

@app.get("/health")
async def health():
    return {"status": "ok", "database": DATABASE_PATH.exists()}

@app.post("/detect-plate")
async def detect_plate(file: UploadFile = File(...)):
    try:
        # Leer imagen
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Imagen inválida")
        
        # Extraer texto de toda la imagen
        plate_text = extract_text(image)
        
        if plate_text:
            runner_name = get_runner(plate_text)
            return {
                "message": "Placa detectada",
                "plates": [{
                    "plate_number": plate_text,
                    "runner_name": runner_name,
                    "confidence": 0.8,
                    "coordinates": {"x1": 0, "y1": 0, "x2": image.shape[1], "y2": image.shape[0]},
                    "method": "full_image_ocr"
                }]
            }
        else:
            return JSONResponse(
                status_code=404,
                content={"message": "No se detectó placa", "plates": []}
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/runners")
async def get_runners():
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT plate_number, runner_name FROM runners ORDER BY plate_number')
    runners = cursor.fetchall()
    conn.close()
    
    return {
        "runners": [{"plate_number": p, "runner_name": n} for p, n in runners]
    }

if __name__ == "__main__":
    print("[INFO] Iniciando servidor en puerto 8001...")
    uvicorn.run(app, host="127.0.0.1", port=8001)
