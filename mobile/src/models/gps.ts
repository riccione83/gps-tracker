export interface GPSPacket {
  latitude: number;
  longitude: number;
  device: number;
  speed: number;
  altitude: number;
  accuracy: number;
  activity: string | null;
  timestamp: Date;
}
