export type RecordingDocument = {
  filename: string;
  location: {
    city: string;
    latitude: number;
    longitude: number;
  };
  isClientGeolocation: boolean;
  timestamp: number;
};
