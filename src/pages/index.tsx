import Head from "next/head";

import { api } from "~/utils/api";

export default function Home() {
  const recs = api.ibm.getRecordings.useQuery();

  return (
    <>
      <Head>
        <title>JamaisVu</title>
        <meta name="description" content="JamaisVu" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <ul className="text-2xl text-white">
            {recs.data ? (
              recs.data.map((rec) => (
                <li key={rec._id?.toString()}>{rec.description}</li>
              ))
            ) : (
              <li>Loading recordings...</li>
            )}
          </ul>
        </div>
      </main>
    </>
  );
}
