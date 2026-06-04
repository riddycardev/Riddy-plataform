/**
 * Cloudinary Integration Test
 * Tests the complete flow of uploading vehicle images to Cloudinary
 */

import { describe, it, expect } from 'vitest';
import { uploadToCloudinary } from './cloudinaryUpload';

describe('Cloudinary Integration', () => {
  it('should upload base64 image to Cloudinary and return public URL', async () => {
    // Create a small 1x1 red pixel PNG in base64
    const redPixelBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    
    const result = await uploadToCloudinary(redPixelBase64, 'test-vehicles/test-upload');
    
    // Verify result structure
    expect(result).toHaveProperty('url');
    expect(result).toHaveProperty('publicId');
    
    // Verify URL is from Cloudinary
    expect(result.url).toContain('cloudinary.com');
    expect(result.url).toContain('image/upload');
    
    // Verify URL is accessible (returns 200)
    const response = await fetch(result.url);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('image');
    
    console.log('✅ Cloudinary upload successful!');
    console.log('📸 Image URL:', result.url);
    console.log('🆔 Public ID:', result.publicId);
  }, 30000); // 30 second timeout for upload
  
  it('should handle upload errors gracefully', async () => {
    const invalidBase64 = 'invalid-base64-data';
    
    await expect(uploadToCloudinary(invalidBase64, 'test')).rejects.toThrow();
  });
});
