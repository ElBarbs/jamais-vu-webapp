import { useEffect, useState } from "react";
import Head from "next/head";
import { RingLoader } from "react-spinners";

import { Button } from "~/components/ui/button";
import Recorder from "~/components/recorder";
import { api } from "~/utils/api";
import Menu from "~/components/menu";

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
      setAudioBlob(null);
      setAudioURL(null);
    },
  });

  const uploadRecordingMetadata = api.ibm.uploadRecordingMetadata.useMutation();

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
      <header className="flex min-h-24 flex-row items-center justify-center">
        <Menu />
      </header>
      <main className="m-8 flex min-h-[60svh] flex-col items-center justify-center">
        <div className="container flex flex-col items-center justify-center gap-8">
          <p className="text-center text-4xl">Jamais Vu</p>
          <div className="flex min-h-72 flex-col items-center justify-start gap-8">
            <Recorder
              onRecordingStateChange={handleRecordingStateChange}
              disabled={isUploading}
            />
            <div className="flex flex-col items-center gap-4">
              {audioURL && <audio controls src={audioURL}></audio>}
              {audioBlob && (
                <Button
                  onClick={handleUpload}
                  className="bg-blue-500 text-white duration-300 hover:bg-blue-500/90"
                  disabled={isUploading}
                >
                  {isUploading ? "Uploading..." : "Upload Audio"}
                </Button>
              )}
            </div>
            {isUploading && <RingLoader />}
          </div>
        </div>
      </main>
    </>
  );
}
