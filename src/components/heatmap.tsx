import { useEffect, useRef, useState } from "react";
import { helpers, config, Map, MapStyle } from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";

import { api } from "~/utils/api";

export default function Heatmap() {
  const { data } = api.ibm.getLocationData.useQuery();
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  config.apiKey = "TrL3sAf4neBKXDqRr8pY";

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new Map({
      container: mapContainer.current,
      style: MapStyle.DATAVIZ.DARK,
      zoom: 13,
      geolocate: true,
      fullscreenControl: true,
    });

    map.current.on("load", () => {
      setIsMapLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (isMapLoaded && data) {
      if (!data || !map.current) return;
      helpers.addHeatmap(map.current, {
        data: data,
      });
    }
  }, [isMapLoaded, data]);

  return (
    <div className="relative h-[70svh] w-full border border-slate-200">
      <div ref={mapContainer} className="absolute h-full w-full" />
    </div>
  );
}
