import { useEffect } from "react";

import type { Location } from "~/types/Location";

interface GeolocationProps {
  onLocation: (location: Location) => void;
}

export default function Geolocation({ onLocation }: GeolocationProps) {
  useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            error: null,
          };
          onLocation(newLocation); // Pass location data to parent
        },
        (error) => {
          const errorLocation: Location = {
            latitude: null,
            longitude: null,
            error: error.message,
          };
          onLocation(errorLocation); // Pass error to parent
        },
      );
    } else {
      const unsupportedError: Location = {
        latitude: null,
        longitude: null,
        error: "Geolocation not supported by this browser.",
      };
      onLocation(unsupportedError); // Pass error to parent
    }
  }, [onLocation]);

  return <></>;
}
