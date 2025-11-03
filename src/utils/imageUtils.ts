import { Platform } from 'react-native';

export interface ImageProcessingResult {
  base64: string;
  mimeType: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  fileName: string;
}

export interface ImageValidationError {
  type: 'size' | 'format' | 'dimension' | 'security';
  message: string;
}

// Configuration constants
export const IMAGE_CONFIG = {
  MAX_FILE_SIZE: 2 * 1024 * 1024, // 2MB
  MAX_DIMENSION: 1024, // 1024px max width/height (reduced from 2048)
  QUALITY: 0.6, // 60% quality for compression (reduced from 80%)
  SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/webp'] as const,
  COMPRESSION_THRESHOLD: 100 * 1024, // Compress if > 100KB (reduced from 500KB)
  DISPLAY_MAX_SIZE: 100 * 1024, // 100KB target for display
  UPLOAD_MAX_SIZE: 500 * 1024, // 500KB target for upload
};

/**
 * Validates an image file for security and constraints
 */
export function validateImageFile(file: File): ImageValidationError | null {
  // Check file size
  if (file.size > IMAGE_CONFIG.MAX_FILE_SIZE) {
    return {
      type: 'size',
      message: `File size ${formatFileSize(file.size)} exceeds maximum allowed size of ${formatFileSize(IMAGE_CONFIG.MAX_FILE_SIZE)}`
    };
  }

  // Check file format
  if (!IMAGE_CONFIG.SUPPORTED_FORMATS.includes(file.type as any)) {
    return {
      type: 'format',
      message: `File format ${file.type} is not supported. Please use JPEG, PNG, or WebP.`
    };
  }

  // Basic security check - ensure it's actually an image
  if (!file.type.startsWith('image/')) {
    return {
      type: 'security',
      message: 'File does not appear to be a valid image'
    };
  }

  return null;
}

/**
 * Compresses and processes an image file
 */
export async function processImage(file: File | any): Promise<ImageProcessingResult> {
  // FIXED: Handle native image objects from expo-image-picker with compression
  if (file.base64 && file.width && file.height && !file.name) {
    // This is a native image object from expo-image-picker
    let base64 = file.base64;
    let width = file.width;
    let height = file.height;
    let compressedSize = Math.round(base64.length * 0.75);
    const originalSize = file.size || compressedSize;
    
    // Try to use expo-image-manipulator for native compression if available
    if (Platform.OS !== 'web' && file.uri) {
      try {
        const ImageManipulator = await import('expo-image-manipulator').catch(() => null);
        if (ImageManipulator) {
          const { width: maxDim, height: maxHeight } = calculateDimensions(width, height);
          
          // Compress the image using expo-image-manipulator
          const manipResult = await ImageManipulator.manipulateAsync(
            file.uri,
            [{ resize: { width: maxDim, height: maxHeight } }],
            { compress: IMAGE_CONFIG.QUALITY, format: ImageManipulator.SaveFormat.JPEG, base64: true }
          );
          
          if (manipResult.base64) {
            base64 = manipResult.base64;
            width = manipResult.width;
            height = manipResult.height;
            compressedSize = Math.round(base64.length * 0.75);
          }
        }
      } catch (error) {
        console.log('Native compression not available, using original image');
      }
    }
    
    return {
      base64,
      mimeType: file.type || 'image/jpeg',
      originalSize,
      compressedSize,
      width,
      height,
      fileName: file.uri ? file.uri.split('/').pop() || 'image.jpg' : 'image.jpg'
    };
  }
  
  // Web path with FileReader
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }

          // Calculate new dimensions
          const { width, height } = calculateDimensions(img.width, img.height);
          
          canvas.width = width;
          canvas.height = height;

          // Draw and compress image
          ctx.drawImage(img, 0, 0, width, height);
          
          // Adaptive compression - try different quality levels to hit target size
          let quality = IMAGE_CONFIG.QUALITY;
          let base64 = '';
          let compressedSize = file.size;
          
          // Try progressively lower quality to achieve target size
          const targetSize = IMAGE_CONFIG.UPLOAD_MAX_SIZE;
          for (let q = quality; q >= 0.3; q -= 0.1) {
            const testDataUrl = canvas.toDataURL(file.type === 'image/png' ? 'image/jpeg' : file.type, q);
            base64 = testDataUrl.split(',')[1];
            compressedSize = Math.round(base64.length * 0.75);
            
            if (compressedSize <= targetSize) {
              quality = q;
              break;
            }
          }
          
          // If still too large, reduce dimensions further
          if (compressedSize > targetSize && width > 512) {
            const scale = 512 / width;
            canvas.width = Math.round(width * scale);
            canvas.height = Math.round(height * scale);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            const smallDataUrl = canvas.toDataURL(file.type === 'image/png' ? 'image/jpeg' : file.type, quality);
            base64 = smallDataUrl.split(',')[1];
            compressedSize = Math.round(base64.length * 0.75);
          }
          
          resolve({
            base64,
            mimeType: file.type,
            originalSize: file.size,
            compressedSize,
            width,
            height,
            fileName: file.name
          });
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = event.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Calculate optimal dimensions while maintaining aspect ratio
 */
function calculateDimensions(originalWidth: number, originalHeight: number): { width: number; height: number } {
  const maxDim = IMAGE_CONFIG.MAX_DIMENSION;
  
  if (originalWidth <= maxDim && originalHeight <= maxDim) {
    return { width: originalWidth, height: originalHeight };
  }
  
  const aspectRatio = originalWidth / originalHeight;
  
  if (originalWidth > originalHeight) {
    return {
      width: maxDim,
      height: Math.round(maxDim / aspectRatio)
    };
  } else {
    return {
      width: Math.round(maxDim * aspectRatio),
      height: maxDim
    };
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Generate a thumbnail from base64 image data
 */
export async function generateThumbnail(
  base64: string, 
  mimeType: string, 
  maxSize: number = 150
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      
      // Calculate thumbnail dimensions
      const aspectRatio = img.width / img.height;
      let width = maxSize;
      let height = maxSize;
      
      if (img.width > img.height) {
        height = Math.round(maxSize / aspectRatio);
      } else {
        width = Math.round(maxSize * aspectRatio);
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw thumbnail
      ctx.drawImage(img, 0, 0, width, height);
      
      // Aggressive compression for thumbnails - target ~100KB
      // Use JPEG for better compression even if original was PNG
      const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.5);
      resolve(thumbnailDataUrl.split(',')[1]);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to generate thumbnail'));
    };
    
    img.src = `data:${mimeType};base64,${base64}`;
  });
}

/**
 * Check if the current platform supports file upload
 */
export function isImageUploadSupported(): boolean {
  if (Platform.OS === 'web') {
    return typeof FileReader !== 'undefined' && typeof File !== 'undefined';
  }
  return true; // React Native supports image picker
}

/**
 * Get MIME type from base64 data URL
 */
export function getMimeTypeFromDataUrl(dataUrl: string): string {
  const match = dataUrl.match(/data:([^;]+);/);
  return match ? match[1] : 'image/jpeg';
}

/**
 * Validate base64 image data
 */
export function validateBase64Image(base64: string, mimeType: string): boolean {
  try {
    // Check if it's valid base64
    const decoded = atob(base64);
    
    // Check if MIME type is supported
    if (!IMAGE_CONFIG.SUPPORTED_FORMATS.includes(mimeType as any)) {
      return false;
    }
    
    // Basic length check
    if (decoded.length === 0) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Create a data URL from base64 and MIME type
 */
export function createDataUrl(base64: string, mimeType: string): string {
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Extract metadata from processed image
 */
export interface ImageMetadata {
  width: number;
  height: number;
  fileSize: number;
  mimeType: string;
  aspectRatio: number;
  isLandscape: boolean;
  isPortrait: boolean;
  isSquare: boolean;
}

export function extractImageMetadata(result: ImageProcessingResult): ImageMetadata {
  const aspectRatio = result.width / result.height;
  
  return {
    width: result.width,
    height: result.height,
    fileSize: result.compressedSize,
    mimeType: result.mimeType,
    aspectRatio,
    isLandscape: aspectRatio > 1,
    isPortrait: aspectRatio < 1,
    isSquare: Math.abs(aspectRatio - 1) < 0.1 // Within 10% of square
  };
}