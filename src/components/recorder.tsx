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
  const [ip, setIP] = useState<string>("");
  const [location, setLocation] = useState<GeolocationPosition | undefined>(
    undefined,
  );

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
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

    return upload(base64, ip, location);
  };

  const upload = async (
    base64: string,
    ip: string,
    location?: GeolocationPosition,
  ) => {
    if (!location) {
      return await uploadRecording
        .mutateAsync({
          base64: base64,
          ip: ip,
        })
        .then(() => {
          setUploadState(false);
        });
    }

    return await uploadRecording
      .mutateAsync({
        base64: base64,
        ip: ip,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      })
      .then(() => {
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
          //getLocationFromIP();
          //setErrorMessage("Please enable location access to start recording.");
        },
      );
    } else {
      // Get the user's IP address.
      //getLocationFromIP();
      //setErrorMessage("Browser does not support geolocation.");
    }
  }, []);

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage("Browser does not support audio recording.");
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      void fetch("https://api64.ipify.org?format=json").then(async (res) => {
        const data = (await res.json()) as { ip: string };
        setIP(data.ip);
      });
    }
  }, []);

  const resetRecording = () => {
    setAudioBlob(null);
    setAudioURL("");
    setTimeLeft(maxDuration);
    clearInterval(countdownIntervalRef.current);
  };

  // Helper function to create and set up balanced audio processing pipeline.
  const setupAudioProcessing = async (stream: MediaStream) => {
    // Create an audio context with a standard sample rate.
    const audioContext = new AudioContext({ sampleRate: 44100 });
    // Store reference if needed: audioContextRef.current = audioContext;

    // Create a source node from the microphone stream.
    const sourceNode = audioContext.createMediaStreamSource(stream);

    // High-pass filter:
    // Lower cutoff (e.g., 40Hz) allows more of the natural low-frequency ambience
    // while reducing very low rumble that may be unwanted.
    const highPassFilter = audioContext.createBiquadFilter();
    highPassFilter.type = "highpass";
    highPassFilter.frequency.value = 40; // Adjust as needed for your environment

    // Note: For ambient recordings, you may want to capture as much of the spectrum as possible.
    // Therefore, we omit a low-pass filter here to preserve high-frequency details.

    // Compressor:
    // Use a gentle ratio (2:1) with a soft knee to lightly tame peaks without squashing the natural dynamics.
    // Slower attack and release settings help maintain the ambience without introducing artifacts.
    const compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.value = -35; // Begins compressing when peaks exceed this level
    compressor.knee.value = 10; // Soft knee for a smoother transition into compression
    compressor.ratio.value = 2; // Gentle compression ratio for natural dynamics
    compressor.attack.value = 0.1; // 100ms attack time to allow transient detail
    compressor.release.value = 0.3; // 300ms release time for a smooth recovery

    // Final gain adjustment:
    // Set to unity gain (1.0) as a starting point; tweak if the overall level needs further adjustment.
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 1.0;

    // Connect the nodes in sequence:
    // Source -> High-Pass Filter -> Compressor -> Gain -> MediaStreamDestination
    sourceNode.connect(highPassFilter);
    highPassFilter.connect(compressor);
    compressor.connect(gainNode);

    // Create a MediaStream from the processed audio.
    const destination = audioContext.createMediaStreamDestination();
    gainNode.connect(destination);

    return destination.stream;
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
          //setErrorMessage("Please enable location access to start recording.");
          //return;
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
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
        },
      });
      streamRef.current = stream;
    } catch (err) {
      if (err instanceof Error && err.name === "NotAllowedError") {
        setErrorMessage("Please enable microphone access to start recording.");
      }
      return;
    }

    // Process the audio stream to maintain consistent volume
    const processedStream = await setupAudioProcessing(stream);

    // Initialize the recorder with the processed stream
    const recorder = new MediaRecorder(processedStream, {
      mimeType: "audio/wav",
    });
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

      // Clean up audio context
      if (audioContextRef.current) {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }

      // Stop all tracks in the original stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

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
            {!isRecording && !audioBlob && (
              <>
                <p>Record your surroundings.</p>
              </>
            )}
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
