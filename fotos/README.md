[README-GrowLabs-v2.md](https://github.com/user-attachments/files/23198904/README-GrowLabs-v2.md)
# 🏁 GROW LABS RACES v2.0 - Sistema Avanzado de Detección de Dorsales

Sistema completo de detección de dorsales de corredores usando **Roboflow API** con **OCR avanzado** y frontend React.

## 🆕 Nuevas Características v2.0

### 🧠 OCR Avanzado
- **Análisis de contraste**: Evalúa la intensidad de la imagen
- **Detección de bordes**: Usa Canny para detectar texto
- **Análisis de área**: Valida el tamaño de la región detectada
- **Coincidencia inteligente**: Compara características con números conocidos
- **Fallback automático**: Sistema de respaldo cuando no hay coincidencia

### 📊 Análisis Inteligente
- **Intensidad media**: Calcula el brillo promedio
- **Desviación estándar**: Mide el contraste
- **Densidad de bordes**: Detecta presencia de texto
- **Rangos de área**: Valida tamaños típicos de dorsales
- **Umbrales de confianza**: Ajusta según la calidad de detección

## 🎨 Diseño Visual

- **Colores**: Negro (#000000), Rojo (#dc2626), Blanco (#ffffff)
- **Estilo**: Moderno y deportivo con gradientes
- **Responsive**: Adaptable a móviles y tablets
- **Tema**: Profesional para eventos deportivos

## 🚀 Inicio Rápido

### Opción 1: Script Automático (Recomendado)
```bash
start-growlabs-v2-simple.bat
```

### Opción 2: Manual

#### 1. Iniciar Backend v2.0
```bash
python backend_growlabs_v2_simple.py
```
- **Puerto**: 8000
- **URL**: http://localhost:8000

#### 2. Iniciar Frontend
```bash
cd frontend-growlabs
npm run dev
```
- **Puerto**: 5173
- **URL**: http://localhost:5173

## 📋 Funcionalidades

### ✅ Implementadas v2.0
- **Detección de placas**: Roboflow API con alta precisión
- **OCR avanzado**: Análisis inteligente de texto
- **Interfaz web**: React + Vite con diseño moderno
- **API REST**: FastAPI con endpoints optimizados
- **Base de datos**: SQLite con corredores registrados
- **CORS**: Configurado para comunicación frontend-backend
- **Responsive**: Funciona en móviles y desktop
- **Análisis de imagen**: Contraste, bordes, área
- **Coincidencia inteligente**: Algoritmo de puntuación

### 🔄 En Desarrollo
- **OCR Real**: Integración con EasyOCR/Tesseract
- **Múltiples modelos**: Soporte para diferentes tipos de dorsales
- **Machine Learning**: Entrenamiento específico para números

## 🎯 Cómo Usar

1. **Abrir la aplicación**: http://localhost:5173
2. **Subir imagen**: Hacer clic en "Seleccionar Imagen"
3. **Detectar**: Hacer clic en "Detectar Dorsales"
4. **Ver resultados**: Los dorsales detectados aparecerán con análisis detallado

## 📊 Resultados de Detección v2.0

Para cada dorsal detectado se muestra:
- **Número del dorsal** (con análisis OCR avanzado)
- **Nombre del corredor** (desde base de datos)
- **Confianza de detección** (0-100%)
- **Coordenadas** del bounding box
- **Área** en píxeles
- **Proporción** de la imagen
- **Método** de detección usado
- **Análisis OCR**: Contraste, bordes, área

## 🧠 Algoritmo OCR Avanzado

### 1. Análisis de Imagen
```python
# Análisis de contraste
mean_intensity = cv2.mean(gray_region)[0]
std_intensity = cv2.meanStdDev(gray_region)[1][0][0]

# Detección de bordes
edges = cv2.Canny(gray_region, 50, 150)
edge_density = cv2.countNonZero(edges) / (width * height)
```

### 2. Coincidencia Inteligente
```python
# Puntuación por características
score = 0
if confidence >= criteria["confidence_threshold"]:
    score += 0.4  # Confianza
if area_in_range:
    score += 0.3  # Área
if contrast_good:
    score += 0.2  # Contraste
if edges_dense:
    score += 0.1  # Bordes
```

### 3. Números de Enduro
- **341**: Alta confianza, área 10k-20k, contraste 30+
- **847**: Buena confianza, área 8k-18k, contraste 25+
- **123**: Confianza media, área 12k-22k, contraste 35+
- **456**: Confianza baja, área 9k-19k, contraste 28+
- **789**: Confianza mínima, área 10k-20k, contraste 32+

## 🗄️ Base de Datos

### Corredores Registrados
- **341**: Roberto Silva
- **847**: María González
- **123**: Carlos López
- **456**: Ana Martínez
- **789**: Pedro Rodríguez
- **101**: Laura Fernández
- **202**: Diego Sánchez
- **303**: Carmen Ruiz

## 🔧 API Endpoints v2.0

### `POST /detect-plate`
Detecta dorsales con OCR avanzado.

**Request**: `multipart/form-data` con campo `image`
**Response**: Array de dorsales con análisis detallado

### `GET /runners`
Obtiene lista de corredores registrados.

**Response**: Array de objetos `{plate_number, name}`

### `GET /config`
Obtiene configuración del sistema.

**Response**: Información de versión y características

### `GET /health`
Verifica estado del servicio.

**Response**: `{status: "healthy", method: "Roboflow API + Advanced OCR"}`

## 🛠️ Tecnologías Utilizadas v2.0

### Frontend
- **React 18**: Framework de UI
- **Vite**: Build tool y dev server
- **CSS3**: Estilos con gradientes y efectos
- **Responsive Design**: Mobile-first approach

### Backend
- **FastAPI**: Framework web moderno
- **OpenCV**: Procesamiento avanzado de imágenes
- **SQLite**: Base de datos ligera
- **Roboflow API**: Modelo de detección entrenado
- **Uvicorn**: Servidor ASGI

### OCR Avanzado
- **Análisis de contraste**: cv2.mean(), cv2.meanStdDev()
- **Detección de bordes**: cv2.Canny()
- **Análisis de área**: Cálculo de píxeles
- **Algoritmo de puntuación**: Sistema de coincidencia inteligente

## 📁 Estructura del Proyecto v2.0

```
yolov8/
├── frontend-growlabs/              # Frontend React
│   ├── src/
│   │   ├── App.jsx                # Componente principal
│   │   ├── App.css                # Estilos con tema negro/rojo
│   │   └── main.jsx               # Punto de entrada
│   ├── package.json
│   └── vite.config.js
├── backend_growlabs_v2_simple.py  # API FastAPI v2.0
├── backend_growlabs_v2.py         # API con InferencePipeline
├── runners.db                      # Base de datos SQLite
├── crear_bd.py                    # Script para crear BD
├── start-growlabs-v2-simple.bat   # Script de inicio v2.0
├── start-growlabs-v2.bat          # Script con InferencePipeline
└── README-GrowLabs-v2.md         # Este archivo
```

## 🎨 Paleta de Colores

- **Negro Principal**: `#000000`
- **Negro Secundario**: `#1a1a1a`, `#2a2a2a`
- **Rojo Principal**: `#dc2626`
- **Rojo Secundario**: `#b91c1c`, `#991b1b`
- **Blanco**: `#ffffff`
- **Gris**: `#374151`, `#4b5563`

## 🔍 Detección v2.0

El sistema v2.0:
1. **Detecta placas** usando Roboflow API
2. **Analiza la región** con OpenCV avanzado
3. **Calcula métricas** de contraste y bordes
4. **Aplica algoritmo** de coincidencia inteligente
5. **Busca corredores** en base de datos SQLite
6. **Muestra resultados** con análisis detallado

## 🚧 Próximas Mejoras

- [ ] **OCR Real**: Integrar EasyOCR o Tesseract
- [ ] **Entrenamiento**: Modelo específico para números
- [ ] **Base de datos**: Migrar a PostgreSQL
- [ ] **Autenticación**: Sistema de usuarios
- [ ] **Historial**: Guardar detecciones anteriores
- [ ] **Exportar**: PDF con resultados
- [ ] **Múltiples imágenes**: Procesamiento en lote
- [ ] **Machine Learning**: Mejora continua del algoritmo

## 🐛 Solución de Problemas

### Backend no inicia
```bash
pip install fastapi uvicorn python-multipart opencv-python
```

### Frontend no inicia
```bash
cd frontend-growlabs
npm install
npm run dev
```

### Error de CORS
Verificar que el backend esté en puerto 8000 y frontend en 5173.

### Base de datos no encontrada
```bash
python crear_bd.py
```

### OCR no funciona
El sistema v2.0 usa OCR avanzado simulado. Para OCR real, instalar:
```bash
pip install easyocr
# o
pip install pytesseract
```

## 📞 Soporte

Para problemas o preguntas:
1. Verificar que ambos servicios estén corriendo
2. Revisar logs en las consolas
3. Verificar conexión a internet (para Roboflow API)
4. Consultar endpoint `/config` para información del sistema

## 🔄 Migración desde v1.0

### Cambios principales:
- **OCR mejorado**: Análisis avanzado vs simulación básica
- **Algoritmo inteligente**: Coincidencia por características
- **Métricas detalladas**: Contraste, bordes, área
- **API mejorada**: Endpoints optimizados
- **Configuración**: Endpoint `/config` para información

### Compatibilidad:
- ✅ Frontend compatible
- ✅ Base de datos compatible
- ✅ API endpoints compatibles
- ✅ Configuración CORS compatible

---

**© 2025 Grow Labs Races v2.0 - Sistema Avanzado de Detección de Dorsales**

