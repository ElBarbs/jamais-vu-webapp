export type RecordingDocument = {
  filename: string;
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
};
