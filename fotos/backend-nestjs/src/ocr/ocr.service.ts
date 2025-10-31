import { Injectable, Logger } from '@nestjs/common';
import Tesseract from 'tesseract.js';
import sharp from 'sharp';

export interface OcrResult {
  text: string;
  confidence: number;
}

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  /**
   * Extrae el número del dorsal de una región específica de la imagen
   */
  async extractBibNumber(
    imagePath: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ): Promise<OcrResult | null> {
    try {
      this.logger.log(
        `Extracting bib number from region: x=${x}, y=${y}, w=${width}, h=${height}`,
      );

      // Recortar la región del dorsal
      const croppedImageBuffer = await this.cropImage(
        imagePath,
        x,
        y,
        width,
        height,
      );

      // Aplicar OCR con Tesseract
      const result = await this.performOcr(croppedImageBuffer);

      if (!result) {
        return null;
      }

      // Extraer solo números
      const cleanedText = this.extractNumbers(result.text);

      if (!cleanedText) {
        this.logger.warn(`No numbers found in OCR result: "${result.text}"`);
        return null;
      }

      this.logger.log(
        `OCR result: "${cleanedText}" (confidence: ${result.confidence.toFixed(2)})`,
      );

      return {
        text: cleanedText,
        confidence: result.confidence,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error extracting bib number: ${errorMessage}`);
      return null;
    }
  }

  /**
   * Recorta una región específica de la imagen y la preprocesa para OCR
   * MEJORADO: Mayor resize, mejor contraste, threshold adaptativo
   */
  private async cropImage(
    imagePath: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ): Promise<Buffer> {
    try {
      // Agregar MÁS padding para mejor contexto
      const padding = 20;
      const left = Math.max(0, Math.round(x - width / 2 - padding));
      const top = Math.max(0, Math.round(y - height / 2 - padding));
      const cropWidth = Math.round(width + padding * 2);
      const cropHeight = Math.round(height + padding * 2);

      // Resize MÁS GRANDE para mejor reconocimiento
      const scaleFactor = 6;

      // Preprocesamiento mejorado para OCR
      const buffer = await sharp(imagePath)
        .extract({
          left,
          top,
          width: cropWidth,
          height: cropHeight,
        })
        // Resize más grande
        .resize(cropWidth * scaleFactor, cropHeight * scaleFactor, {
          kernel: sharp.kernel.lanczos3,
          fit: 'fill',
        })
        // Convertir a escala de grises
        .greyscale()
        // Normalizar histograma
        .normalize()
        // Aumentar contraste
        .linear(1.5, -(128 * 0.5))
        // Sharpen para mejor definición
        .sharpen({
          sigma: 1.5,
          m1: 1,
          m2: 2,
        })
        // Threshold para binarizar
        .threshold(128, {
          grayscale: false,
        })
        .toBuffer();

      return buffer;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error cropping image: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Ejecuta Tesseract OCR en el buffer de imagen
   */
  private async performOcr(imageBuffer: Buffer): Promise<OcrResult | null> {
    try {
      const {
        data: { text, confidence },
      } = await Tesseract.recognize(imageBuffer, 'eng', {
        logger: (info: { status: string; progress: number }) => {
          if (info.status === 'recognizing text') {
            this.logger.debug(
              `OCR progress: ${Math.round(info.progress * 100)}%`,
            );
          }
        },
      });

      const trimmedText = text.trim();
      
      // Log para debug
      this.logger.debug(`Raw OCR text: "${trimmedText}"`);

      return {
        text: trimmedText,
        confidence: confidence / 100,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Tesseract OCR error: ${errorMessage}`);
      return null;
    }
  }

  /**
   * Extrae solo dígitos del texto OCR
   */
  private extractNumbers(text: string): string {
    // Remover espacios, saltos de línea y caracteres no numéricos
    const numbers = text.replace(/\D/g, '');
    
    // Validar que sea un número de dorsal válido (1-6 dígitos)
    if (numbers.length > 0 && numbers.length <= 6) {
      return numbers;
    }

    return '';
  }

  /**
   * Procesa múltiples detecciones en batch
   */
  async extractMultipleBibNumbers(
    imagePath: string,
    detections: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
    }>,
  ): Promise<Array<OcrResult | null>> {
    this.logger.log(
      `Processing ${detections.length} detections with OCR`,
    );

    const results = await Promise.all(
      detections.map((detection) =>
        this.extractBibNumber(
          imagePath,
          detection.x,
          detection.y,
          detection.width,
          detection.height,
        ),
      ),
    );

    const successfulResults = results.filter((r) => r !== null).length;
    this.logger.log(
      `OCR completed: ${successfulResults}/${detections.length} successful`,
    );

    return results;
  }
}
