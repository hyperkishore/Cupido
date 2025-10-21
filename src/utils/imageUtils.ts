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
  MAX_DIMENSION: 2048, // 2048px max width/height
  QUALITY: 0.8, // 80% quality for compression
  SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/webp'] as const,
  COMPRESSION_THRESHOLD: 500 * 1024, // Compress if > 500KB
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
export async function processImage(file: File): Promise<ImageProcessingResult> {
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
          
          // Determine if compression is needed
          const shouldCompress = file.size > IMAGE_CONFIG.COMPRESSION_THRESHOLD;
          const quality = shouldCompress ? IMAGE_CONFIG.QUALITY : 1.0;
          
          // Convert to base64
          const compressedDataUrl = canvas.toDataURL(file.type, quality);
          const base64 = compressedDataUrl.split(',')[1];
          
          // Calculate compressed size
          const compressedSize = Math.round(base64.length * 0.75); // Approximate size
          
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
      
      // Convert to base64
      const thumbnailDataUrl = canvas.toDataURL(mimeType, 0.7);
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