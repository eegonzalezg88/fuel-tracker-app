import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAllRecords, addRecord } from '../lib/sheetsService';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      const records = await getAllRecords();
      return res.status(200).json({ success: true, data: records });
    }

    if (req.method === 'POST') {
      const record = req.body;
      
      if (!record.id || !record.date || !record.pricePerGallon || !record.gallons || !record.odometerReading) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields' 
        });
      }

      const newRecord = await addRecord(record);
      return res.status(201).json({ success: true, data: newRecord });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
}
