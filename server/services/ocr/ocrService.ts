import { createWorker, PSM } from 'tesseract.js';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

class OcrService {
  private static instance: OcrService;

  private constructor() {}

  public static getInstance(): OcrService {
    if (!OcrService.instance) {
      OcrService.instance = new OcrService();
    }
    return OcrService.instance;
  }

  /**
   * Preprocesses an image to improve OCR accuracy
   */
  async preprocessImage(imagePath: string): Promise<string> {
    console.log('OCR Service: Preprocessing image:', imagePath);
    try {
      const outputPath = path.join(path.dirname(imagePath), 'preprocessed_' + path.basename(imagePath));
      
      await sharp(imagePath)
        // Convert to grayscale
        .grayscale()
        // Increase contrast
        .normalize()
        // Sharpen the image
        .sharpen()
        // Resize if too large while maintaining aspect ratio
        .resize(1500, 2000, {
          fit: 'inside',
          withoutEnlargement: true
        })
        // Save the processed image
        .toFile(outputPath);
      
      console.log('OCR Service: Image preprocessing complete');
      return outputPath;
    } catch (error) {
      console.error('OCR Service: Error preprocessing image:', error);
      throw error;
    }
  }

  /**
   * Performs OCR on an image
   */
  async performOcr(imagePath: string): Promise<string> {
    console.log('OCR Service: Starting OCR on image:', imagePath);
    try {
      const worker = await createWorker('eng');
      
      // Configure worker for better text recognition
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?@#$%&*()-_+=:;"\'/ ',
        tessedit_pageseg_mode: PSM.AUTO, // Automatic page segmentation with OSD
        tessedit_ocr_engine_mode: 3, // Default, based on what is available
      });
      
      const { data: { text } } = await worker.recognize(imagePath);
      await worker.terminate();
      
      console.log('OCR Service: Raw OCR output:', text);
      
      // Clean up the text
      const cleanedText = this.cleanOcrText(text);
      console.log('OCR Service: Cleaned OCR output:', cleanedText);
      
      return cleanedText;
    } catch (error) {
      console.error('OCR Service: Error performing OCR:', error);
      throw error;
    }
  }

  /**
   * Cleans OCR text output
   */
  private cleanOcrText(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove excessive newlines
      .replace(/\n\s*\n/g, '\n')
      // Remove special characters that might interfere with parsing
      .replace(/[^\w\s.,!?@#$%&*()-_+=:;"\'\/\n]/g, '')
      // Trim whitespace
      .trim();
  }

  /**
   * Determines if an image is likely a movie ticket based on text content
   */
  isMovieTicket(text: string): boolean {
    console.log('OCR Service: Checking if text is from a movie ticket');
    // Keywords commonly found on movie tickets
    const ticketKeywords = [
      'ticket', 'cinema', 'theater', 'theatre', 'admit', 'admission',
      'seat', 'row', 'showtime', 'show time', 'screening', 'auditorium',
      'movie', 'film', 'feature', 'presentation', 'showing'
    ];
    
    const lowercaseText = text.toLowerCase();
    
    // Check if at least 2 ticket keywords are present
    let keywordCount = 0;
    const foundKeywords: string[] = [];
    
    for (const keyword of ticketKeywords) {
      if (lowercaseText.includes(keyword)) {
        keywordCount++;
        foundKeywords.push(keyword);
        if (keywordCount >= 2) {
          console.log('OCR Service: Confirmed movie ticket - found keywords:', foundKeywords);
          return true;
        }
      }
    }
    
    console.log('OCR Service: Not enough movie ticket keywords found. Found:', foundKeywords);
    return false;
  }
}

export default OcrService.getInstance();
