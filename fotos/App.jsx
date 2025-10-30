import React, { useState } from 'react'
import './App.css'

function App() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [detectionResults, setDetectionResults] = useState(null)
  const [processedImage, setProcessedImage] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setDetectionResults(null)
      setProcessedImage(null)
      setError(null)
    }
  }

  const handleDetect = async () => {
    if (!selectedFile) {
      setError('Por favor selecciona una imagen')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image', selectedFile)

      const response = await fetch('http://localhost:8009/detect-plate', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Error en la detección')
      }

      const results = await response.json()
      setDetectionResults(results.detections)
      setProcessedImage(results.processed_image)
    } catch (err) {
      setError('Error al procesar la imagen: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const clearResults = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setDetectionResults(null)
    setProcessedImage(null)
    setError(null)
  }

  return (
    <div className="app">
      {/* Hero Section */}
      <header className="hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">GROW LABS RACES</h1>
          <p className="hero-subtitle">Sistema Profesional de Detección de Dorsales</p>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-number">99%</span>
              <span className="stat-label">Precisión</span>
            </div>
            <div className="stat">
              <span className="stat-number">&lt; 3s</span>
              <span className="stat-label">Procesamiento</span>
            </div>
            <div className="stat">
              <span className="stat-number">24/7</span>
              <span className="stat-label">Disponible</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="container">
          {/* Upload Section */}
          <section className="upload-section">
            <div className="section-header">
              <h2>Cargar Imagen</h2>
              <p>Sube una foto del evento para detectar dorsales automáticamente</p>
            </div>
            
            <div className="upload-area">
              <input
                type="file"
                id="file-input"
                accept="image/*"
                onChange={handleFileSelect}
                className="file-input"
              />
              <label htmlFor="file-input" className="upload-label">
                <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="upload-text">
                  {selectedFile ? selectedFile.name : 'Haz clic o arrastra una imagen aquí'}
                </span>
                <span className="upload-hint">PNG, JPG hasta 10MB</span>
              </label>
            </div>

            {selectedFile && (
              <div className="file-actions">
                <button onClick={handleDetect} className="btn btn-primary" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <span className="spinner"></span>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Detectar Dorsales
                    </>
                  )}
                </button>
                <button onClick={clearResults} className="btn btn-secondary">
                  <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Limpiar
                </button>
              </div>
            )}
          </section>

          {/* Error Message */}
          {error && (
            <div className="alert alert-error">
              <svg className="alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Results Section */}
          {processedImage && (
            <section className="results-section">
              <div className="section-header">
                <h2>Resultados de Detección</h2>
                <p>Imagen procesada con dorsales detectados</p>
              </div>

              <div className="results-grid">
                {/* Processed Image */}
                <div className="result-image-card">
                  <h3>Imagen Procesada</h3>
                  <div className="image-wrapper">
                    <img 
                      src={`data:image/jpeg;base64,${processedImage}`} 
                      alt="Imagen procesada" 
                      className="processed-image"
                    />
                  </div>
                </div>

                {/* Detection Details */}
                <div className="detection-details">
                  <h3>Detalles de Detección</h3>
                  <div className="details-summary">
                    <div className="summary-item">
                      <span className="summary-label">Total Detectados:</span>
                      <span className="summary-value">{detectionResults?.length || 0}</span>
                    </div>
                  </div>

                  {detectionResults && detectionResults.length > 0 ? (
                    <div className="detections-list">
                      {detectionResults.map((result, index) => (
                        <div key={index} className="detection-card">
                          <div className="detection-header">
                            <span className="detection-number">#{index + 1}</span>
                            <span className="confidence-badge">
                              {(result.confidence * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="detection-body">
                            <div className="detection-row">
                              <span className="label">Número:</span>
                              <span className="value">{result.text}</span>
                            </div>
                            <div className="detection-row">
                              <span className="label">Corredor:</span>
                              <span className="value">{result.runner_name}</span>
                            </div>
                            <div className="detection-row">
                              <span className="label">Clase:</span>
                              <span className="value">{result.class_name}</span>
                            </div>
                            <div className="detection-row">
                              <span className="label">Área:</span>
                              <span className="value">{result.area} px²</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-detections">
                      <svg className="no-detections-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p>No se detectaron dorsales en la imagen</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Grow Labs Races</h4>
            <p>Sistema profesional de detección de dorsales para eventos deportivos</p>
          </div>
          <div className="footer-section">
            <h4>Tecnología</h4>
            <p>Powered by Roboflow AI & Computer Vision</p>
          </div>
          <div className="footer-section">
            <h4>Contacto</h4>
            <p>info@growlabsraces.com</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 Grow Labs Races. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}

export default App