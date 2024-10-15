import Head from "next/head";

import Recorder from "~/components/Recorder";

export default function Home() {
  return (
    <>
      <Head>
        <title>Jamais Vu</title>
        <meta name="description" content="Jamais Vu" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#e3dac9] to-[#d6cfc4]">
        <div className="container flex flex-col items-center justify-center gap-8 px-4 py-16">
          <h1 className="text-center text-4xl font-light italic text-gray-800">
            Jamais Vu
          </h1>
          <Recorder />
        </div>
      </main>
    </>
  );
}
