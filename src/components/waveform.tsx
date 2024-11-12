import { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";

interface WaveformProps {
  url: string;
  playing?: boolean;
}

export default function Waveform({ url, playing = false }: WaveformProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (containerRef.current && !wavesurferRef.current) {
      wavesurferRef.current = WaveSurfer.create({
        container: containerRef.current,
        barWidth: 2,
        sampleRate: 48000,
        normalize: true,
      });

      wavesurferRef.current.on("finish", () => {
        wavesurferRef.current?.stop();
        void wavesurferRef.current?.play();
      });
    }

    // Only load URL if WaveSurfer is ready
    if (wavesurferRef.current && url) {
      void wavesurferRef.current.load(url);
    }
  }, [url]);

  useEffect(() => {
    if (wavesurferRef.current) {
      if (playing) {
        void wavesurferRef.current.play();
      } else {
        wavesurferRef.current.pause();
      }
    }
  }, [playing]);

  return <div ref={containerRef} className="w-full"></div>;
}
