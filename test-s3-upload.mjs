import { storagePut } from './server/storage.ts';
import fs from 'fs';

async function testS3Upload() {
  console.log('🧪 Testing S3 upload...');
  
  // Create a simple test image (1x1 pixel PNG)
  const testImageBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  
  try {
    const result = await storagePut(
      `test-images/test-${Date.now()}.png`,
      testImageBuffer,
      'image/png'
    );
    
    console.log('✅ Upload successful!');
    console.log('URL:', result.url);
    console.log('Key:', result.key);
    
    // Test if URL is accessible
    console.log('\n🔍 Testing URL accessibility...');
    const response = await fetch(result.url);
    console.log('Status:', response.status);
    console.log('Content-Type:', response.headers.get('content-type'));
    
    if (response.ok) {
      console.log('✅ URL is publicly accessible!');
    } else {
      console.log('❌ URL is NOT accessible!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testS3Upload();
