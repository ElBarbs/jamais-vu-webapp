import Head from "next/head";
import Header from "~/components/header";
import Heatmap from "~/components/heatmap";

export default function Explore() {
  return (
    <>
      <Head>
        <title>Jamais Vu - Explore</title>
        <meta name="description" content="Explore" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      <main className="mx-8 my-4 flex flex-col items-center justify-start">
        <div className="container flex flex-col items-center justify-center gap-8">
          <Heatmap />
        </div>
      </main>
    </>
  );
}
