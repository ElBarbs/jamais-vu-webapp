import { useEffect, useState, useRef } from "react";

import { Button } from "~/components/ui/button";

interface AudioRecorderProps {
  onRecordingStateChange: (audioBlob: Blob | null) => void;
  disabled?: boolean;
}

export default function Recorder({
  onRecordingStateChange,
  disabled,
}: AudioRecorderProps) {
  const maxDuration = 15; // 15 seconds.
  const [timeLeft, setTimeLeft] = useState(maxDuration);
  const [isRecording, setIsRecording] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const countdownIntervalRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage("Browser does not support audio recording.");
    }
  }, []);

  const resetRecording = () => {
    onRecordingStateChange(null);
    setTimeLeft(maxDuration);
    clearInterval(countdownIntervalRef.current);
  };

  const startRecording = async () => {
    const { connect } = await import("extendable-media-recorder-wav-encoder");
    const { MediaRecorder, register } = await import(
      "extendable-media-recorder"
    );

    try {
      if (!mediaRecorderRef.current) {
        await register(await connect());
      }

      const stream: MediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/wav" });

      console.log(stream.getAudioTracks()[0]?.getSettings());

      resetRecording();
      mediaRecorderRef.current = recorder as MediaRecorder;

      const chunks: Blob[] = [];

      recorder.ondataavailable = (e: BlobEvent) => {
        chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" });
        onRecordingStateChange(blob);
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
    } catch (err) {
      setErrorMessage("Error accessing microphone.");
      console.error(err);
    }
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
            <Button
              onClick={stopRecording}
              className="bg-red-500 text-white duration-300 hover:bg-red-500/90"
            >
              Stop Recording
            </Button>
            <div className="flex flex-col items-center">
              <p className="text-3xl">{timeLeft}</p>
              <p>seconds left</p>
            </div>
          </>
        ) : (
          <Button
            onClick={startRecording}
            disabled={disabled}
            className="bg-green-500 text-white duration-300 hover:bg-green-500/90"
          >
            Start Recording
          </Button>
        )}
      </div>
      {errorMessage && <p>{errorMessage}</p>}
    </div>
  );
}
