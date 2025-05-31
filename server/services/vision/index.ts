import { VisionProviderOptions } from './types';
import visionProviderRegistry from './visionProviderRegistry';
import ticketScannerService from './ticketScannerService';
import ticketRoutes from './ticketRoutes';
import VisionProviderTest from './visionProviderTest';

// Re-export everything needed for public use
export {
  visionProviderRegistry,
  ticketScannerService,
  ticketRoutes,
  VisionProviderTest,
  VisionProviderOptions
};

// Default export
export default {
  visionProviderRegistry,
  ticketScannerService,
  ticketRoutes,
  VisionProviderTest
};
