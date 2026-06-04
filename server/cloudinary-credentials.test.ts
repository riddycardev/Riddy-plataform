import { describe, it, expect } from 'vitest';
import { v2 as cloudinary } from 'cloudinary';

describe('Cloudinary Credentials', () => {
  it('should have valid Cloudinary credentials configured', async () => {
    // Configure Cloudinary with environment variables
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    // Validate credentials by calling Cloudinary API
    try {
      const result = await cloudinary.api.ping();
      expect(result.status).toBe('ok');
    } catch (error: any) {
      throw new Error(`Cloudinary credentials are invalid: ${error.message}`);
    }
  });

  it('should have all required environment variables', () => {
    expect(process.env.CLOUDINARY_CLOUD_NAME).toBeDefined();
    expect(process.env.CLOUDINARY_CLOUD_NAME).not.toBe('');
    
    expect(process.env.CLOUDINARY_API_KEY).toBeDefined();
    expect(process.env.CLOUDINARY_API_KEY).not.toBe('');
    
    expect(process.env.CLOUDINARY_API_SECRET).toBeDefined();
    expect(process.env.CLOUDINARY_API_SECRET).not.toBe('');
  });
});
