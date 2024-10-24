import { useEffect, useState } from "react";
import Head from "next/head";
import { RingLoader } from "react-spinners";

import Recorder from "~/components/Recorder";
import { api } from "~/utils/api";

export default function Home() {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [isUploading, setUploadState] = useState(false);

  const handleRecordingStateChange = (blob: Blob | null) => {
    setAudioBlob(blob);
    const url = blob ? URL.createObjectURL(blob) : null;
    setAudioURL(url);
  };

  const uploadRecording = api.ibm.uploadRecording.useMutation({
    onSuccess: () => {
      console.log("Upload successful.");
      setAudioBlob(null);
      setAudioURL(null);
    },
  });

  const uploadRecordingMetadata = api.ibm.uploadRecordingMetadata.useMutation({
    onSuccess: () => {
      console.log("Metadata uploaded.");
    },
  });

  const handleUpload = async () => {
    if (!audioBlob) return;

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
      console.error("Geolocation not supported by this browser.");
    }
  }, []);

  return (
    <>
      <Head>
        <title>Jamais Vu</title>
        <meta name="description" content="Jamais Vu" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#e3dac9] to-[#d6cfc4] font-mono">
        <div className="container flex flex-col items-center justify-center gap-8 px-4 py-16">
          <h1 className="text-center text-4xl font-light text-gray-800">
            Jamais Vu
          </h1>
          <div className="flex min-h-72 flex-col items-center justify-start gap-8">
            <Recorder onRecordingStateChange={handleRecordingStateChange} />
            <div className="flex flex-col items-center gap-2">
              {audioURL && <audio controls src={audioURL}></audio>}
              {audioBlob && (
                <button
                  onClick={handleUpload}
                  className="mt-4 rounded-lg bg-blue-500 px-4 py-2 text-white shadow-md transition-colors duration-300 hover:bg-blue-600"
                >
                  {isUploading ? "Uploading..." : "Upload Audio"}
                </button>
              )}
            </div>
            {isUploading && <RingLoader />}
          </div>
        </div>
      </main>
    </>
  );
}
