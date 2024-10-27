import { useEffect } from "react";
import L from "leaflet";

export default function Map() {
  useEffect(() => {
    // Initialize the map and set its view to Montreal's coordinates with a zoom level of 12
    const map = L.map("map").setView([45.5017, -73.5673], 12);

    // Clean up map instance on component unmount
    return () => {
      map.remove();
    };
  }, []);

  return (
    <div
      id="map"
      style={{
        height: "500px",
        width: "100%",
      }}
    />
  );
}
