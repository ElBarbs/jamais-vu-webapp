import "@maptiler/sdk/dist/maptiler-sdk.css";

import { useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { helpers, config, Map, MapStyle } from "@maptiler/sdk";
import { PauseIcon, PlayIcon } from "@radix-ui/react-icons";

import { api } from "~/utils/api";
import Waveform from "~/components/waveform";

export default function Heatmap() {
  const { data } = api.ibm.getLocationData.useQuery();

  const [filename, setFilename] = useState<string>("");
  const debouncedSetFilename = useDebouncedCallback((name: string) => {
    setFilename(name);
  }, 300);
  const [audioData, setAudioData] = useState<string | null>(null);
  const [isPlaying, setPlayingState] = useState(false);
  const getAudioRecording = api.ibm.getRecording.useQuery(filename, {
    enabled: !!filename,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

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
    if (isMapLoaded && data && map.current) {
      if (!map.current.getLayer("audioPoints")) {
        helpers.addPoint(map.current, {
          layerId: "audioPoints",
          sourceId: "audioPoints",
          data: data,
          pointColor: "#E5E7EB",
        });

        map.current.on("click", "audioPoints", (e) => {
          const features = map.current!.queryRenderedFeatures(e.point, {
            layers: ["audioPoints"],
          });

          if (features.length) {
            debouncedSetFilename(features[0]?.properties.filename as string);
            setPlayingState(false);
          }
        });

        map.current.on("mouseenter", "audioPoints", () => {
          map.current!.getCanvas().style.cursor = "pointer";
        });

        map.current.on("mouseleave", "audioPoints", () => {
          map.current!.getCanvas().style.cursor = "";
        });
      }

      if (!map.current.getLayer("heatmap")) {
        helpers.addHeatmap(map.current, {
          data: data,
        });
      }
    }
  }, [isMapLoaded, data, debouncedSetFilename]);

  useEffect(() => {
    if (filename) {
      setAudioData(null);
      void getAudioRecording.refetch().then((resp) => {
        if (resp.data) {
          setAudioData(resp.data);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filename]);

  return (
    <>
      <div className="relative h-[70svh] w-full">
        <div
          ref={mapContainer}
          className="absolute h-3/4 w-full border border-gray-600"
        />
        <div
          id="audio-player"
          className="flex min-h-28 items-center justify-center gap-4 border border-gray-600 bg-[#292929] p-2"
        >
          {audioData && (
            <>
              <button
                className="duration-300 hover:scale-105"
                onClick={() => {
                  setPlayingState((prev) => !prev);
                }}
              >
                {isPlaying ? (
                  <PauseIcon className="size-8" />
                ) : (
                  <PlayIcon className="size-8" />
                )}
              </button>
              <Waveform
                url={`data:audio/wav;base64,${audioData}`}
                height={48}
                playing={isPlaying}
              />
            </>
          )}
          {getAudioRecording.isFetching && <p>Fetching audio...</p>}
          {filename == "" && <p>Select a point to play audio.</p>}
        </div>
      </div>
    </>
  );
}
