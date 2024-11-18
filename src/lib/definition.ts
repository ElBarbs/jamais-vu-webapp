export type RecordingDocument = {
  filename: string;
  location: {
    latitude: number;
    longitude: number;
  };
  isClientGeolocation: boolean;
  timestamp: string;
};
