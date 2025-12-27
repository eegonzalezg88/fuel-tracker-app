import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
];

interface SheetRecord {
  id: string;
  date: string;
  gasStationName: string;
  serviceType: string;
  pricePerGallon: number;
  gallons: number;
  totalAmount: number;
  odometerReading: number;
  kmSinceLastVisit: number;
}

let cachedDoc: GoogleSpreadsheet | null = null;

async function getDoc(): Promise<GoogleSpreadsheet> {
  if (cachedDoc) return cachedDoc;

  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: SCOPES,
  });

  const doc = new GoogleSpreadsheet(
    process.env.GOOGLE_SHEET_ID!,
    serviceAccountAuth
  );

  await doc.loadInfo();
  cachedDoc = doc;
  return doc;
}

async function getSheet() {
  const doc = await getDoc();
  let sheet = doc.sheetsByIndex[0];
  
  if (!sheet) {
    sheet = await doc.addSheet({ headerValues: [
      'id',
      'date',
      'gasStationName',
      'serviceType',
      'pricePerGallon',
      'gallons',
      'totalAmount',
      'odometerReading',
      'kmSinceLastVisit',
    ]});
  }
  
  return sheet;
}

export async function getAllRecords(): Promise<SheetRecord[]> {
  try {
    const sheet = await getSheet();
    const rows = await sheet.getRows();
    
    return rows.map((row) => ({
      id: row.get('id'),
      date: row.get('date'),
      gasStationName: row.get('gasStationName'),
      serviceType: row.get('serviceType'),
      pricePerGallon: parseFloat(row.get('pricePerGallon')),
      gallons: parseFloat(row.get('gallons')),
      totalAmount: parseFloat(row.get('totalAmount')),
      odometerReading: parseFloat(row.get('odometerReading')),
      kmSinceLastVisit: parseFloat(row.get('kmSinceLastVisit')),
    }));
  } catch (error) {
    console.error('Error getting all records:', error);
    throw new Error('Failed to fetch records from Google Sheets');
  }
}

export async function addRecord(record: SheetRecord): Promise<SheetRecord> {
  try {
    const sheet = await getSheet();
    await sheet.addRow({
      id: record.id,
      date: record.date,
      gasStationName: record.gasStationName,
      serviceType: record.serviceType,
      pricePerGallon: record.pricePerGallon,
      gallons: record.gallons,
      totalAmount: record.totalAmount,
      odometerReading: record.odometerReading,
      kmSinceLastVisit: record.kmSinceLastVisit,
    });
    
    return record;
  } catch (error) {
    console.error('Error adding record:', error);
    throw new Error('Failed to add record to Google Sheets');
  }
}

export async function updateRecord(id: string, record: SheetRecord): Promise<SheetRecord> {
  try {
    const sheet = await getSheet();
    const rows = await sheet.getRows();
    const rowIndex = rows.findIndex((row) => row.get('id') === id);
    
    if (rowIndex === -1) {
      throw new Error('Record not found');
    }
    
    const row = rows[rowIndex];
    row.set('date', record.date);
    row.set('gasStationName', record.gasStationName);
    row.set('serviceType', record.serviceType);
    row.set('pricePerGallon', record.pricePerGallon);
    row.set('gallons', record.gallons);
    row.set('totalAmount', record.totalAmount);
    row.set('odometerReading', record.odometerReading);
    row.set('kmSinceLastVisit', record.kmSinceLastVisit);
    
    await row.save();
    
    return record;
  } catch (error) {
    console.error('Error updating record:', error);
    throw new Error('Failed to update record in Google Sheets');
  }
}

export async function deleteRecord(id: string): Promise<void> {
  try {
    const sheet = await getSheet();
    const rows = await sheet.getRows();
    const rowIndex = rows.findIndex((row) => row.get('id') === id);
    
    if (rowIndex === -1) {
      throw new Error('Record not found');
    }
    
    await rows[rowIndex].delete();
  } catch (error) {
    console.error('Error deleting record:', error);
    throw new Error('Failed to delete record from Google Sheets');
  }
}
