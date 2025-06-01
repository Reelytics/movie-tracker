import path from 'path';
import fs from 'fs';
import visionProviderRegistry from './visionProviderRegistry';
import { VisionProvider } from './types';

/**
 * Utility to test and compare results from different vision providers
 */
class VisionProviderTest {
  private static readonly TEST_IMAGES_DIR = path.join(process.cwd(), 'tests', 'vision');
  
  /**
   * Run tests on all available vision providers
   * @returns Results for each provider
   */
  static async testAllProviders(): Promise<Map<string, any>> {
    console.log('Running vision provider tests...');
    
    // Get all available providers
    const providers = visionProviderRegistry.getAllProviderNames().map(
      name => visionProviderRegistry.getProvider(name)
    ).filter((provider): provider is VisionProvider => provider !== null);
    
    if (providers.length === 0) {
      console.warn('No vision providers available for testing');
      return new Map();
    }
    
    // Create test directory if it doesn't exist
    this.ensureTestDirectory();
    
    // Get test images
    const testImages = this.getTestImages();
    
    if (testImages.length === 0) {
      console.warn('No test images found in', this.TEST_IMAGES_DIR);
      return new Map();
    }
    
    // Run tests for each provider
    const results = new Map<string, any>();
    
    for (const provider of providers) {
      console.log(`Testing provider: ${provider.name}`);
      try {
        // Test connection
        const isConnected = await provider.testConnection();
        
        if (!isConnected) {
          console.warn(`Provider ${provider.name} failed connection test`);
          results.set(provider.name, {
            connected: false,
            error: 'Failed connection test'
          });
          continue;
        }
        
        // Run ticket extraction test on each image
        const providerResults = [];
        
        for (const imagePath of testImages) {
          try {
            console.log(`Testing ${provider.name} with image: ${path.basename(imagePath)}`);
            const result = await provider.extractTicketData(imagePath);
            providerResults.push({
              imageName: path.basename(imagePath),
              success: result.success,
              data: result.data,
              error: result.error
            });
          } catch (error) {
            console.error(`Error testing ${provider.name} with ${path.basename(imagePath)}:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            providerResults.push({
              imageName: path.basename(imagePath),
              success: false,
              data: null,
              error: errorMessage
            });
          }
        }
        
        results.set(provider.name, {
          connected: true,
          results: providerResults
        });
        
      } catch (error) {
        console.error(`Error testing provider ${provider.name}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.set(provider.name, {
          connected: false,
          error: errorMessage
        });
      }
    }
    
    return results;
  }
  
  /**
   * Ensure test directory exists and create if not
   */
  private static ensureTestDirectory(): void {
    if (!fs.existsSync(this.TEST_IMAGES_DIR)) {
      fs.mkdirSync(this.TEST_IMAGES_DIR, { recursive: true });
      console.log(`Created test directory: ${this.TEST_IMAGES_DIR}`);
      
      // Add a README to help users add test images
      const readmePath = path.join(this.TEST_IMAGES_DIR, 'README.txt');
      fs.writeFileSync(
        readmePath,
        'Place movie ticket test images in this directory to test vision providers.\n' +
        'Images should be JPEG, PNG, or other common image formats.\n'
      );
    }
  }
  
  /**
   * Get all test images in the test directory
   * @returns Array of image file paths
   */
  private static getTestImages(): string[] {
    if (!fs.existsSync(this.TEST_IMAGES_DIR)) {
      return [];
    }
    
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.tiff'];
    const files = fs.readdirSync(this.TEST_IMAGES_DIR);
    
    return files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return imageExtensions.includes(ext);
      })
      .map(file => path.join(this.TEST_IMAGES_DIR, file));
  }
  
  /**
   * Compare results between providers
   * @param results Map of provider results
   * @returns Comparison analysis
   */
  static compareResults(results: Map<string, any>): any {
    const analysis = {
      providersCount: results.size,
      connectedCount: 0,
      imageComparisons: [] as any[]
    };
    
    // Count connected providers
    for (const [_, providerData] of Array.from(results.entries())) {
      if (providerData.connected) {
        analysis.connectedCount++;
      }
    }
    
    // Skip comparison if less than 2 connected providers
    if (analysis.connectedCount < 2) {
      return analysis;
    }
    
    // Get all image names from all providers
    const allImageNames = new Set<string>();
    
    for (const [_, providerData] of Array.from(results.entries())) {
      if (providerData.connected && providerData.results) {
        for (const result of providerData.results) {
          allImageNames.add(result.imageName);
        }
      }
    }
    
    // For each image, compare results across providers
    for (const imageName of Array.from(allImageNames)) {
      const imageComparison = {
        imageName,
        providerResults: {} as Record<string, any>,
        fieldAgreement: {} as Record<string, any>
      };
      
      // Extract data for this image from each provider
      for (const [providerName, providerData] of Array.from(results.entries())) {
        if (providerData.connected && providerData.results) {
          const imageResult = providerData.results.find(
            (r: any) => r.imageName === imageName
          );
          
          if (imageResult && imageResult.success) {
            imageComparison.providerResults[providerName] = imageResult.data;
          }
        }
      }
      
      // Calculate agreement on each field
      const fieldNames = [
        'movieTitle', 'showTime', 'showDate', 'price', 'seatNumber',
        'movieRating', 'theaterRoom', 'ticketNumber', 'theaterName',
        'theaterChain', 'ticketType'
      ];
      
      for (const field of fieldNames) {
        const values = new Map<string, number>();
        let totalProviders = 0;
        
        // Count occurrences of each value
        for (const [providerName, data] of Object.entries(imageComparison.providerResults)) {
          const value = (data as any)[field];
          if (value !== null) {
            totalProviders++;
            values.set(value, (values.get(value) || 0) + 1);
          }
        }
        
        // Calculate agreement percentage for most common value
        let mostCommonValue = null;
        let mostCommonCount = 0;
        
        for (const [value, count] of Array.from(values.entries())) {
          if (count > mostCommonCount) {
            mostCommonValue = value;
            mostCommonCount = count;
          }
        }
        
        const agreement = totalProviders > 0
          ? (mostCommonCount / totalProviders) * 100
          : 0;
        
        imageComparison.fieldAgreement[field] = {
          value: mostCommonValue,
          agreement: agreement.toFixed(1) + '%',
          providers: totalProviders
        };
      }
      
      analysis.imageComparisons.push(imageComparison);
    }
    
    return analysis;
  }
}

export default VisionProviderTest;
