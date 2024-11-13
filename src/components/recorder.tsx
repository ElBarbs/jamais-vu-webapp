import { PauseIcon, PlayIcon } from "@radix-ui/react-icons";
import { useEffect, useState, useRef } from "react";

import SpeakerGrid from "~/components/speaker-grid";
import Screws from "~/components/screws";
import Waveform from "~/components/waveform";
import { api } from "~/utils/api";

export default function Recorder() {
  const maxDuration = 15; // 15 seconds.
  const [timeLeft, setTimeLeft] = useState(maxDuration);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setUploadState] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioURL, setAudioURL] = useState<string>("");
  const [location, setLocation] = useState<GeolocationPosition | undefined>(
    undefined,
  );

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const countdownIntervalRef = useRef<number | undefined>(undefined);

  const uploadRecording = api.ibm.uploadRecording.useMutation({
    onSuccess: () => {
      setAudioBlob(null);
      setAudioURL("");
    },
  });

  const handleUpload = async () => {
    if (isUploading || !audioBlob) return;

    const arrayBuffer = await audioBlob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    setUploadState(true);

    uploadRecording
      .mutateAsync({ base64, location })
      .then(() => {
        setUploadState(false);
        resetRecording();
      })
      .catch((err) => {
        console.error(err);
        setUploadState(false);
      });
  };

  useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(position);
        },
        () => {
          setErrorMessage("Please enable location access to start recording.");
        },
      );
    } else {
      setErrorMessage("Browser does not support geolocation.");
    }
  }, []);

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage("Browser does not support audio recording.");
    }
  }, []);

  const resetRecording = () => {
    setAudioBlob(null);
    setAudioURL("");
    setTimeLeft(maxDuration);
    clearInterval(countdownIntervalRef.current);
  };

  const startRecording = async () => {
    if (isUploading) return;

    // Reset error message.
    setErrorMessage("");

    // Check if location access is enabled.
    if (!location) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(position);
        },
        () => {
          setErrorMessage("Please enable location access to start recording.");
          return;
        },
      );
    }

    const { connect } = await import("extendable-media-recorder-wav-encoder");
    const { MediaRecorder, register } = await import(
      "extendable-media-recorder"
    );

    // Register the WAV encoder.
    try {
      await register(await connect());
    } catch (err) {
      console.error(err);
    }

    // Check if microphone access is enabled.
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
    } catch (err) {
      if (err instanceof Error && err.name === "NotAllowedError") {
        setErrorMessage("Please enable microphone access to start recording.");
      }
      return;
    }

    // Initialize the recorder.
    const recorder = new MediaRecorder(stream, { mimeType: "audio/wav" });
    mediaRecorderRef.current = recorder as MediaRecorder;

    // Reset recording state.
    resetRecording();

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e: BlobEvent) => {
      chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "audio/wav" });
      setAudioBlob(blob);
      const url = URL.createObjectURL(blob);
      setAudioURL(url);
      stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
    };

    recorder.start();
    setIsRecording(true);

    // Countdown timer.
    countdownIntervalRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          recorder.stop();
          return maxDuration; // Reset timer after stopping.
        }
        return prev - 1;
      });
    }, 1000);

    // Automatically stop the recording after 15 seconds.
    setTimeout(() => {
      if (recorder.state !== "inactive") {
        recorder.stop();
      }
    }, maxDuration * 1000);
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  return (
    <div className="flex select-none flex-col items-center gap-8">
      <div className="relative flex max-h-[500px] min-w-64 flex-col items-center gap-4 rounded-md border border-gray-900 bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 py-8 shadow-xl">
        <div
          id="recordLight"
          className={`absolute right-5 top-5 size-2 rounded-full bg-red-500/40 shadow-sm transition-colors ${isRecording ? "animate-blink-color" : ""}`}
        ></div>
        <div
          id="device-screen-container"
          className="flex w-8/12 flex-col gap-y-2"
        >
          <Screws />
          <div
            id="screen"
            className="flex h-32 max-w-60 flex-col items-center justify-center rounded-md border-2 border-gray-600 bg-[#78FF34] text-center text-xs text-gray-950 shadow-inner"
          >
            {isRecording && (
              <>
                <p className="text-3xl">
                  {`00:${(timeLeft % 60).toString().padStart(2, "0")}`}
                </p>
                <p>seconds left</p>
              </>
            )}
            {audioBlob && !isUploading && (
              <Waveform url={audioURL} playing={isPlaying} />
            )}
            {isUploading && <p>Uploading...</p>}
            {errorMessage && <p className="mx-2">{errorMessage}</p>}
          </div>
          <Screws />
        </div>
        <div id="device-buttons" className="flex items-center gap-4 text-xs">
          <div className="flex w-24 items-center gap-2">
            <span>REC/STOP</span>
            <div
              id="btnRecord"
              onClick={isRecording ? stopRecording : startRecording}
              className={`size-8 rounded-sm bg-red-500 shadow-md duration-300 hover:scale-105 ${isUploading ? "pointer-events-none opacity-40" : "hover:cursor-pointer"}`}
            ></div>
          </div>
          <div className="flex w-24 items-center gap-2">
            <div
              id="btnUpload"
              onClick={handleUpload}
              className={`size-8 rounded-sm bg-blue-400 shadow-md duration-300 hover:scale-105 ${isUploading ? "pointer-events-none opacity-40" : "hover:cursor-pointer"}`}
            ></div>
            <span>UPLOAD</span>
          </div>
        </div>
        <div
          id="device-playback-container"
          className="flex w-8/12 flex-col gap-y-2"
        >
          <div
            className="m-auto flex w-fit items-center justify-center rounded-md bg-gray-600 p-1 px-2 duration-300 hover:scale-105 hover:cursor-pointer"
            onClick={() => {
              setIsPlaying((prev) => !prev);
            }}
          >
            <PlayIcon className="size-4" />
            <PauseIcon className="size-4" />
          </div>
          <SpeakerGrid rows={5} cols={10} />
        </div>
      </div>
    </div>
  );
}
