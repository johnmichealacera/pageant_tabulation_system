/**
 * Enhanced Cloudinary upload utilities with WebP optimization
 * Combines the existing @jmacera/cloudinary-image-upload package with
 * client-side WebP conversion for better performance.
 */

import { handleFileChange } from "@jmacera/cloudinary-image-upload";

export interface CloudinaryUploadOptions {
  enableWebPOptimization?: boolean;
  showOptimizationInfo?: boolean;
}

export interface CloudinaryUploadResult {
  url: string;
  originalFile: File;
  optimizedFile?: File;
  optimizationInfo?: {
    originalSize: number;
    optimizedSize: number;
    savings: number;
    savingsPercentage: number;
    format: string;
  };
}

/**
 * Convert image to WebP format with quality optimization
 */
async function convertToWebP(
  file: File,
  quality: number = 0.8
): Promise<{ file: File; originalSize: number; optimizedSize: number; format: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = function(event) {
      const img = new Image();
      
      img.onload = function() {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to convert to WebP'));
              return;
            }
            
            const webpFile = new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), {
              type: 'image/webp',
              lastModified: Date.now()
            });
            
            resolve({
              file: webpFile,
              originalSize: file.size,
              optimizedSize: blob.size,
              format: 'webp'
            });
          },
          'image/webp',
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = event.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Check if WebP is supported by the browser
 */
function isWebPSupported(): boolean {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

/**
 * Enhanced file upload to Cloudinary with optional WebP optimization
 */
export async function uploadToCloudinary(
  file: File,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> {
  const {
    enableWebPOptimization = true,
    showOptimizationInfo = false
  } = options;

  const cloudinaryUrl = process.env.NEXT_PUBLIC_CLOUDINARY_URL || '';
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';
  const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || '';

  if (!cloudinaryUrl || !uploadPreset || !apiKey) {
    throw new Error('Cloudinary configuration is missing. Please check your environment variables.');
  }

  let optimizedFile: File | undefined;
  let optimizationInfo: CloudinaryUploadResult['optimizationInfo'];

  // Check if WebP optimization should be applied
  if (enableWebPOptimization && isWebPSupported() && file.type.startsWith('image/')) {
    try {
      // Convert to WebP with quality optimization
      const result = await convertToWebP(file, 0.85);
      optimizedFile = result.file;
      
      if (showOptimizationInfo) {
        optimizationInfo = {
          originalSize: result.originalSize,
          optimizedSize: result.optimizedSize,
          savings: result.originalSize - result.optimizedSize,
          savingsPercentage: ((result.originalSize - result.optimizedSize) / result.originalSize) * 100,
          format: result.format
        };
      }
    } catch (error) {
      console.warn('WebP optimization failed, falling back to original file:', error);
      optimizedFile = file;
    }
  } else {
    optimizedFile = file;
  }

  // Upload to Cloudinary using the optimized file
  const uploadedUrl = await handleFileChange(cloudinaryUrl, uploadPreset, apiKey, optimizedFile);

  if (!uploadedUrl || uploadedUrl.trim() === '') {
    throw new Error('Failed to upload image to Cloudinary');
  }

  return {
    url: uploadedUrl,
    originalFile: file,
    optimizedFile,
    optimizationInfo
  };
}

/**
 * Upload multiple files to Cloudinary with WebP optimization
 */
export async function uploadMultipleToCloudinary(
  files: File[],
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult[]> {
  const results: CloudinaryUploadResult[] = [];
  
  for (const file of files) {
    try {
      const result = await uploadToCloudinary(file, options);
      results.push(result);
    } catch (error) {
      console.error('Failed to upload file:', file.name, error);
      // Continue with next file even if one fails
    }
  }
  
  return results;
}

/**
 * Check if the current environment supports WebP optimization
 */
export function canOptimizeImages(): boolean {
  return typeof window !== 'undefined' && isWebPSupported();
}

/**
 * Get optimization status and recommendations
 */
export function getOptimizationStatus(): {
  supported: boolean;
  recommended: boolean;
  message: string;
} {
  const supported = canOptimizeImages();
  
  if (!supported) {
    return {
      supported: false,
      recommended: false,
      message: 'WebP optimization not supported in this browser'
    };
  }
  
  return {
    supported: true,
    recommended: true,
    message: 'WebP optimization is available and recommended'
  };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

