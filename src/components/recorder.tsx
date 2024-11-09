import {
  Cross1Icon,
  StopIcon,
  UpdateIcon,
  UploadIcon,
} from "@radix-ui/react-icons";
import { useEffect, useState, useRef } from "react";

import CustomAudioPlayer from "~/components/audio-player";
import { api } from "~/utils/api";

export default function Recorder() {
  const maxDuration = 15; // 15 seconds.
  const [timeLeft, setTimeLeft] = useState(maxDuration);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setUploadState] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [location, setLocation] = useState<GeolocationPosition | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const countdownIntervalRef = useRef<number | undefined>(undefined);

  const uploadRecording = api.ibm.uploadRecording.useMutation({
    onSuccess: () => {
      setAudioBlob(null);
      setAudioURL(null);
    },
  });

  const uploadRecordingMetadata = api.ibm.uploadRecordingMetadata.useMutation();

  const handleUpload = async () => {
    if (isUploading || !audioBlob) return;

    const arrayBuffer = await audioBlob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    setUploadState(true);

    uploadRecording
      .mutateAsync({ base64 })
      .then((id: string) => {
        setUploadState(false);

        uploadRecordingMetadata.mutate({
          id: id,
          location: location ? location : undefined,
        });
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
        (error) => {
          console.error(error.message);
        },
      );
    } else {
      console.error("Browser does not support geolocation.");
    }
  }, []);

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage("Browser does not support audio recording.");
    }
  }, []);

  const resetRecording = () => {
    setAudioBlob(null);
    setAudioURL(null);
    setTimeLeft(maxDuration);
    clearInterval(countdownIntervalRef.current);
  };

  const startRecording = async () => {
    if (isUploading) return;

    const { connect } = await import("extendable-media-recorder-wav-encoder");
    const { MediaRecorder, register } = await import(
      "extendable-media-recorder"
    );

    try {
      await register(await connect());
    } catch (err) {
      console.error(err);
    }

    const stream: MediaStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    const recorder = new MediaRecorder(stream, { mimeType: "audio/wav" });

    resetRecording();
    mediaRecorderRef.current = recorder as MediaRecorder;

    const chunks: Blob[] = [];

    recorder.ondataavailable = (e: BlobEvent) => {
      chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "audio/wav" });
      setAudioBlob(blob);
      const url = URL.createObjectURL(blob);
      setAudioURL(url);
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
    <div className="flex flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-4">
        {isRecording ? (
          <>
            <div
              id="btnStop"
              onClick={stopRecording}
              className="relative rounded-full bg-red-500 p-5 text-slate-200 duration-300 hover:scale-105 hover:cursor-pointer"
            >
              <span className="absolute inset-0 animate-ping rounded-full bg-red-500 opacity-75"></span>
              <StopIcon className="relative size-6" />
            </div>
            <div className="flex flex-col items-center">
              <p className="text-3xl">{timeLeft}</p>
              <p>seconds left</p>
            </div>
          </>
        ) : !audioBlob ? (
          <div
            id="btnRecord"
            onClick={startRecording}
            className={`rounded-full bg-slate-200 p-5 duration-300 hover:scale-105 ${isUploading ? "pointer-events-none opacity-40" : "hover:cursor-pointer"}`}
          >
            <div className="size-6 rounded-full bg-red-500"></div>
          </div>
        ) : (
          <>
            <div
              id="btnReset"
              onClick={resetRecording}
              className={`rounded-full bg-red-500 p-5 duration-300 hover:scale-105 ${isUploading ? "pointer-events-none opacity-40" : "hover:cursor-pointer"}`}
            >
              <Cross1Icon className="size-6" />
            </div>
            {audioURL && <CustomAudioPlayer src={audioURL} />}
            <div
              id="btnUpload"
              onClick={handleUpload}
              className={`rounded-full bg-blue-400 p-5 duration-300 hover:scale-105 ${isUploading ? "pointer-events-none" : "hover:cursor-pointer"}`}
            >
              {isUploading ? (
                <UpdateIcon className="size-6 animate-spin" />
              ) : (
                <UploadIcon className="size-6" />
              )}
            </div>
          </>
        )}
      </div>
      {errorMessage && <p>{errorMessage}</p>}
    </div>
  );
}
