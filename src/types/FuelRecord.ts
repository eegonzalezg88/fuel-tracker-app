export interface FuelRecord {
  id: string;
  date: string;
  gasStationName: string;
  serviceType: 'Full Service' | 'Self Service';
  pricePerGallon: number;
  gallons: number;
  totalAmount: number;
  odometerReading: number;
  kmSinceLastVisit: number;
}
