import type { NextApiRequest, NextApiResponse } from 'next';
import { Buffer } from 'buffer';

type Data = {
  base64?: string;
  mimeType?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid URL provided.' });
  }

  try {
    // 1. Fetch the image from the external server
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    // 2. Get the content type
    const mimeType = response.headers.get('content-type') || 'image/jpeg';

    // 3. Convert to buffer then base64
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');

    // 4. Return to frontend
    res.status(200).json({ base64, mimeType });
  } catch (error: any) {
    console.error('Proxy Image Error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch image' });
  }
}