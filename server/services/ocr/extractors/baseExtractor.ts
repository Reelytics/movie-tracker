/**
 * Base class for OCR text extractors
 */
abstract class BaseExtractor {
  /**
   * Extract information from OCR text
   */
  abstract extract(ocrText: string): Promise<string | null>;
  
  /**
   * Clean extracted text
   */
  protected cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s&:'.-]/g, '') // Remove special characters except some punctuation
      .trim();
  }
  
  /**
   * Finds the most likely match from a set of candidates
   * @param candidates - Array of possible extracted values
   * @returns The most likely correct value or null if none found
   */
  protected findBestMatch(candidates: (string | null)[]): string | null {
    // Filter out null and empty strings
    const validCandidates = candidates.filter(c => c !== null && c.trim() !== '');
    
    if (validCandidates.length === 0) {
      return null;
    }
    
    // For now, just return the first valid candidate
    // In a more sophisticated implementation, we could evaluate each candidate
    // based on confidence scores, formatting correctness, etc.
    return validCandidates[0];
  }
}

export default BaseExtractor;
