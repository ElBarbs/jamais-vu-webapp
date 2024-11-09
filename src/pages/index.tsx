import Head from "next/head";

import Header from "~/components/header";
import Recorder from "~/components/recorder";

export default function Home() {
  return (
    <>
      <Head>
        <title>Jamais Vu</title>
        <meta name="description" content="Jamais Vu" />
      </Head>
      <Header />
      <main className="mx-8 my-4 flex flex-col items-center justify-start">
        <div className="container flex flex-col items-center justify-center gap-8">
          <Recorder />
        </div>
      </main>
    </>
  );
}
