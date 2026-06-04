// Image proxy endpoint to serve S3 images with Manus storage authentication
import { Request, Response } from 'express';
import { ENV } from './_core/env';

export async function imageProxyHandler(req: Request, res: Response) {
  try {
    const { path: imagePath } = req.query;
    
    if (!imagePath || typeof imagePath !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid path parameter' });
    }

    // Build download URL using Manus storage API
    const downloadApiUrl = new URL(
      'v1/storage/downloadUrl',
      ENV.forgeApiUrl.endsWith('/') ? ENV.forgeApiUrl : `${ENV.forgeApiUrl}/`
    );
    downloadApiUrl.searchParams.set('path', imagePath);

    // Get presigned URL from Manus storage API
    const response = await fetch(downloadApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ENV.forgeApiKey}`,
      },
    });

    if (!response.ok) {
      console.error('[imageProxy] Failed to get download URL:', response.status, response.statusText);
      return res.status(response.status).json({ error: 'Failed to get image URL' });
    }

    const { url } = await response.json();

    // Fetch the image through the presigned URL
    // We need to fetch it server-side because CloudFront blocks direct browser access
    const imageResponse = await fetch(url);
    
    if (!imageResponse.ok) {
      console.error('[imageProxy] Failed to fetch image from presigned URL:', imageResponse.status, imageResponse.statusText);
      return res.status(imageResponse.status).json({ error: 'Failed to fetch image' });
    }

    // Get content type from response or default to jpeg
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    
    // Set cache headers for better performance
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    
    // Stream the image to the client
    const buffer = await imageResponse.arrayBuffer();
    res.send(Buffer.from(buffer));
    
  } catch (error) {
    console.error('[imageProxy] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
