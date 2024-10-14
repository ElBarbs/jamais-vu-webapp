import { useEffect, useState, useRef } from "react";

import { api } from "~/utils/api";

export default function AudioRecorder() {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null); // Will be assigned dynamically
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const maxDuration = 15 * 1000; // 15 seconds in milliseconds
  const uploadRecording = api.ibm.uploadRecording.useMutation({
    onSuccess: () => {
      setAudioBlob(null);
      setAudioUrl(null);
    },
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return; // Ensure that this code runs on the client only
    }

    // Check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage("Browser does not support audio recording.");
    }
  }, []);

  // Dynamically load the MediaRecorder from extendable-media-recorder on the client side.
  const startRecording = async () => {
    if (typeof window === "undefined") return; // Ensure this runs on the client only.

    const { MediaRecorder, register } = await import(
      "extendable-media-recorder"
    );
    const { connect } = await import("extendable-media-recorder-wav-encoder");

    try {
      if (!mediaRecorderRef.current) {
        // Register the WAV encoder
        await register(await connect());
      }

      const stream: MediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const recorder = new MediaRecorder(stream, {
        mimeType: "audio/wav",
      });

      mediaRecorderRef.current = recorder as MediaRecorder;

      let chunks: Blob[] = [];

      recorder.ondataavailable = (e: BlobEvent) => {
        chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" });
        console.log("Blob created:", blob);
        console.log("Blob type:", blob instanceof Blob);
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setIsRecording(false);
      };

      recorder.start();
      setIsRecording(true);

      // Automatically stop after 15 seconds.
      setTimeout(() => {
        if (recorder.state !== "inactive") {
          recorder.stop();
        }
      }, maxDuration);
    } catch (err) {
      setErrorMessage("Error accessing microphone");
      console.error(err);
    }
  };

  // Stop recording manually
  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // Handle uploading the audio to IBM Cloud.
  const handleUpload = async () => {
    if (!audioBlob) return;

    const arrayBuffer = await audioBlob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    try {
      uploadRecording.mutate({ base64: base64 });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {errorMessage && <p>{errorMessage}</p>}

      {isRecording ? (
        <button
          onClick={stopRecording}
          className="rounded-lg bg-red-500 px-4 py-2 text-white shadow-md transition-colors duration-300 hover:bg-red-600"
        >
          Stop Recording
        </button>
      ) : (
        <button
          onClick={startRecording}
          className="rounded-lg bg-green-500 px-4 py-2 text-white shadow-md transition-colors duration-300 hover:bg-green-600"
        >
          Start Recording
        </button>
      )}

      {audioUrl && (
        <div className="flex flex-col items-center gap-2">
          <audio ref={audioRef} controls src={audioUrl}></audio>
          <button
            onClick={handleUpload}
            className="mt-4 rounded-lg bg-blue-500 px-4 py-2 text-white shadow-md transition-colors duration-300 hover:bg-blue-600"
          >
            Upload Audio
          </button>
        </div>
      )}
    </div>
  );
}
