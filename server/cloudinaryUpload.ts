// Cloudinary upload helper for vehicle images
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
}

/**
 * Upload image to Cloudinary
 * @param base64Data - Base64 encoded image data (with or without data:image prefix)
 * @param folder - Folder path in Cloudinary (e.g., 'vehicles/123')
 * @returns Upload result with URL and metadata
 */
export async function uploadToCloudinary(
  base64Data: string,
  folder: string
): Promise<CloudinaryUploadResult> {
  try {
    // Ensure base64 data has proper prefix
    const base64WithPrefix = base64Data.startsWith('data:')
      ? base64Data
      : `data:image/jpeg;base64,${base64Data}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(base64WithPrefix, {
      folder,
      resource_type: 'image',
      transformation: [
        { width: 1920, height: 1080, crop: 'limit' }, // Max dimensions
        { quality: 'auto:good' }, // Auto quality optimization
        { fetch_format: 'auto' }, // Auto format (WebP for modern browsers)
      ],
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    };
  } catch (error: any) {
    console.error('[Cloudinary] Upload failed:', error);
    throw new Error(`Failed to upload image to Cloudinary: ${error.message}`);
  }
}

/**
 * Delete image from Cloudinary
 * @param publicId - Public ID of the image to delete
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error: any) {
    console.error('[Cloudinary] Delete failed:', error);
    throw new Error(`Failed to delete image from Cloudinary: ${error.message}`);
  }
}

/**
 * Get optimized URL for an image
 * @param publicId - Public ID of the image
 * @param width - Desired width
 * @param height - Desired height
 * @returns Optimized image URL
 */
export function getOptimizedUrl(
  publicId: string,
  width?: number,
  height?: number
): string {
  return cloudinary.url(publicId, {
    width,
    height,
    crop: 'fill',
    quality: 'auto:good',
    fetch_format: 'auto',
  });
}
