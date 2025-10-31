from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
from pathlib import Path
import cv2
import numpy as np
from PIL import Image
import pytesseract
from ultralytics import YOLO
import sqlite3
import re
from typing import Optional

# Configuración de la aplicación
app = FastAPI(title="Grow Labs Races API", version="1.0.0")

# Configurar CORS para permitir comunicación con el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite y React por defecto
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configurar rutas
BASE_DIR = Path(__file__).parent
DATABASE_PATH = BASE_DIR.parent / "database" / "runners.db"
MODEL_PATH = BASE_DIR.parent / "models" / "yolov8n.pt"

# Crear directorios si no existen
DATABASE_PATH.parent.mkdir(exist_ok=True)
MODEL_PATH.parent.mkdir(exist_ok=True)

# Cargar modelo YOLOv8 (se descargará automáticamente si no existe)
try:
    model = YOLO(MODEL_PATH)
    print("[OK] Modelo YOLOv8 cargado correctamente")
except Exception as e:
    print(f"[WARNING] Error cargando modelo: {e}")
    print("[INFO] Descargando modelo YOLOv8...")
    model = YOLO('yolov8n.pt')
    model.save(MODEL_PATH)

def init_database():
    """Inicializar la base de datos SQLite con tabla de corredores"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Crear tabla de corredores
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS runners (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            plate_number TEXT UNIQUE NOT NULL,
            runner_name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Insertar datos de ejemplo si la tabla está vacía
    cursor.execute('SELECT COUNT(*) FROM runners')
    count = cursor.fetchone()[0]
    
    if count == 0:
        sample_data = [
            ('001', 'Juan Pérez'),
            ('002', 'María García'),
            ('003', 'Carlos López'),
            ('004', 'Ana Martínez'),
            ('005', 'Luis Rodríguez'),
            ('123', 'Pedro Sánchez'),
            ('456', 'Laura Fernández'),
            ('789', 'Miguel Torres'),
            ('847', 'Roberto Silva'),  # Número visible en la imagen
            ('999', 'Elena Vargas'),
            ('111', 'Diego Morales'),
            ('222', 'Carmen Ruiz'),
            ('333', 'Fernando Castro'),
            ('444', 'Isabel Moreno'),
            ('555', 'Antonio Jiménez'),
        ]
        
        cursor.executemany(
            'INSERT INTO runners (plate_number, runner_name) VALUES (?, ?)',
            sample_data
        )
        print("[OK] Datos de ejemplo insertados en la base de datos")
    
    conn.commit()
    conn.close()
    print("[OK] Base de datos inicializada correctamente")

def get_runner_by_plate(plate_number: str) -> Optional[str]:
    """Buscar el nombre del corredor por número de placa"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute('SELECT runner_name FROM runners WHERE plate_number = ?', (plate_number,))
    result = cursor.fetchone()
    
    conn.close()
    return result[0] if result else None

def extract_plate_text(image: np.ndarray) -> str:
    """Extraer texto de la imagen usando OCR con múltiples configuraciones"""
    try:
        # Convertir a escala de grises
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Aplicar diferentes técnicas de preprocesamiento
        processed_images = []
        
        # Imagen original
        processed_images.append(gray)
        
        # Aplicar filtro gaussiano
        blurred = cv2.GaussianBlur(gray, (3, 3), 0)
        processed_images.append(blurred)
        
        # Aplicar umbralización adaptativa
        thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
        processed_images.append(thresh)
        
        # Aplicar umbralización OTSU
        _, otsu = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        processed_images.append(otsu)
        
        # Aplicar morfología para limpiar la imagen
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
        morph = cv2.morphologyEx(gray, cv2.MORPH_CLOSE, kernel)
        processed_images.append(morph)
        
        # Configuraciones de Tesseract para probar
        configs = [
            r'--oem 3 --psm 6 -c tessedit_char_whitelist=0123456789',  # Solo números
            r'--oem 3 --psm 8 -c tessedit_char_whitelist=0123456789',  # Palabra única
            r'--oem 3 --psm 7 -c tessedit_char_whitelist=0123456789',  # Línea única
            r'--oem 3 --psm 13 -c tessedit_char_whitelist=0123456789',  # Línea cruda
            r'--oem 3 --psm 6',  # Sin restricción de caracteres
            r'--oem 3 --psm 8',  # Palabra única sin restricción
        ]
        
        best_text = ""
        best_confidence = 0
        
        # Probar todas las combinaciones de imágenes y configuraciones
        for img in processed_images:
            for config in configs:
                try:
                    # Extraer texto
                    text = pytesseract.image_to_string(img, config=config).strip()
                    
                    # Limpiar y extraer solo números
                    numbers = re.findall(r'\d+', text)
                    clean_text = ''.join(numbers)
                    
                    # Validar que sea un número de placa válido (2-4 dígitos)
                    if len(clean_text) >= 2 and len(clean_text) <= 4:
                        # Obtener confianza del OCR
                        try:
                            data = pytesseract.image_to_data(img, config=config, output_type=pytesseract.Output.DICT)
                            confidences = [int(conf) for conf in data['conf'] if int(conf) > 0]
                            avg_confidence = sum(confidences) / len(confidences) if confidences else 0
                            
                            if avg_confidence > best_confidence:
                                best_text = clean_text
                                best_confidence = avg_confidence
                        except:
                            # Si no podemos obtener confianza, usar el texto si es válido
                            if not best_text:
                                best_text = clean_text
                        break
                except:
                    continue
        
        return best_text
        
    except Exception as e:
        print(f"Error en OCR: {e}")
        return ""

@app.on_event("startup")
async def startup_event():
    """Inicializar la aplicación"""
    print("[STARTUP] Iniciando Grow Labs Races API...")
    init_database()
    print("[OK] API lista para recibir requests")

@app.get("/")
async def root():
    """Endpoint de salud"""
    return {"message": "Grow Labs Races API - Sistema de detección de placas de corredores"}

@app.get("/health")
async def health_check():
    """Verificar estado de la API"""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "database_exists": DATABASE_PATH.exists()
    }

@app.post("/detect-plate")
async def detect_plate(file: UploadFile = File(...)):
    """Detectar placa de corredor en imagen"""
    try:
        # Validar tipo de archivo
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="El archivo debe ser una imagen")
        
        # Leer imagen
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(status_code=400, detail="No se pudo procesar la imagen")
        
        # Detectar objetos con YOLOv8
        results = model(image)
        
        # Buscar placas usando múltiples estrategias
        plates_detected = []
        
        # Estrategia 1: Detectar personas y buscar placas en sus regiones
        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    # Obtener coordenadas del bounding box
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    confidence = box.conf[0].cpu().numpy()
                    class_id = int(box.cls[0].cpu().numpy())
                    
                    # Buscar personas (class_id 0 en COCO dataset)
                    if class_id == 0 and confidence > 0.3:
                        # Expandir región para incluir posible placa
                        height = y2 - y1
                        width = x2 - x1
                        
                        # Buscar placa en la región del torso (parte superior del cuerpo)
                        torso_y1 = max(0, int(y1 + height * 0.1))
                        torso_y2 = min(image.shape[0], int(y1 + height * 0.6))
                        torso_x1 = max(0, int(x1 - width * 0.1))
                        torso_x2 = min(image.shape[1], int(x2 + width * 0.1))
                        
                        torso_region = image[torso_y1:torso_y2, torso_x1:torso_x2]
                        
                        # Intentar detectar placa en la región del torso
                        plate_text = extract_plate_text(torso_region)
                        
                        if plate_text and len(plate_text) >= 2:
                            # Buscar corredor en la base de datos
                            runner_name = get_runner_by_plate(plate_text)
                            
                            plates_detected.append({
                                "plate_number": plate_text,
                                "runner_name": runner_name,
                                "confidence": float(confidence),
                                "coordinates": {
                                    "x1": torso_x1,
                                    "y1": torso_y1,
                                    "x2": torso_x2,
                                    "y2": torso_y2
                                },
                                "method": "person_detection"
                            })
        
        # Estrategia 2: Si no se detectaron placas, buscar en toda la imagen
        if not plates_detected:
            # Dividir imagen en regiones y buscar placas
            height, width = image.shape[:2]
            
            # Buscar en diferentes regiones de la imagen
            regions = [
                (0, 0, width//2, height//2),  # Cuadrante superior izquierdo
                (width//2, 0, width, height//2),  # Cuadrante superior derecho
                (0, height//2, width//2, height),  # Cuadrante inferior izquierdo
                (width//2, height//2, width, height),  # Cuadrante inferior derecho
            ]
            
            for x1, y1, x2, y2 in regions:
                region = image[y1:y2, x1:x2]
                plate_text = extract_plate_text(region)
                
                if plate_text and len(plate_text) >= 2:
                    runner_name = get_runner_by_plate(plate_text)
                    
                    plates_detected.append({
                        "plate_number": plate_text,
                        "runner_name": runner_name,
                        "confidence": 0.7,  # Confianza media para detección por región
                        "coordinates": {
                            "x1": int(x1),
                            "y1": int(y1),
                            "x2": int(x2),
                            "y2": int(y2)
                        },
                        "method": "region_search"
                    })
                    break  # Si encontramos una placa, no buscar más
        
        if not plates_detected:
            return JSONResponse(
                status_code=404,
                content={
                    "message": "No se detectaron placas en la imagen",
                    "plates": []
                }
            )
        
        return {
            "message": f"Se detectaron {len(plates_detected)} placa(s)",
            "plates": plates_detected
        }
        
    except Exception as e:
        print(f"Error procesando imagen: {e}")
        raise HTTPException(status_code=500, detail=f"Error procesando imagen: {str(e)}")

@app.post("/debug-detect")
async def debug_detect(file: UploadFile = File(...)):
    """Endpoint de debug para probar la detección paso a paso"""
    try:
        # Leer imagen
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(status_code=400, detail="No se pudo procesar la imagen")
        
        debug_info = {
            "image_shape": image.shape,
            "detection_steps": []
        }
        
        # Detectar objetos con YOLOv8
        results = model(image)
        
        # Información de debug sobre detecciones
        for i, result in enumerate(results):
            boxes = result.boxes
            if boxes is not None:
                for j, box in enumerate(boxes):
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    confidence = box.conf[0].cpu().numpy()
                    class_id = int(box.cls[0].cpu().numpy())
                    
                    debug_info["detection_steps"].append({
                        "step": f"Detection {i}-{j}",
                        "class_id": class_id,
                        "confidence": float(confidence),
                        "coordinates": {
                            "x1": int(x1), "y1": int(y1),
                            "x2": int(x2), "y2": int(y2)
                        },
                        "is_person": class_id == 0
                    })
        
        # Probar OCR en diferentes regiones
        height, width = image.shape[:2]
        regions = [
            ("center", width//4, height//4, 3*width//4, 3*height//4),
            ("top_half", 0, 0, width, height//2),
            ("bottom_half", 0, height//2, width, height),
        ]
        
        ocr_results = []
        for name, x1, y1, x2, y2 in regions:
            region = image[y1:y2, x1:x2]
            plate_text = extract_plate_text(region)
            ocr_results.append({
                "region": name,
                "coordinates": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
                "extracted_text": plate_text,
                "found_in_db": get_runner_by_plate(plate_text) is not None if plate_text else False
            })
        
        debug_info["ocr_results"] = ocr_results
        
        return debug_info
        
    except Exception as e:
        return {"error": str(e)}

@app.get("/runners")
async def get_runners():
    """Obtener lista de todos los corredores"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute('SELECT plate_number, runner_name FROM runners ORDER BY plate_number')
    runners = cursor.fetchall()
    
    conn.close()
    
    return {
        "runners": [
            {"plate_number": plate, "runner_name": name}
            for plate, name in runners
        ]
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
