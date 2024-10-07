import Head from "next/head";
import Link from "next/link";

import { api } from "~/utils/api";

export default function Home() {
  const movies = api.mongodb.getMovies.useQuery();

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
            {movies.data ? (
              movies.data.map((movie) => (
                <li key={movie._id.toString()}>{movie.title}</li>
              ))
            ) : (
              <li>Loading movies...</li>
            )}
          </ul>
        </div>
      </main>
    </>
  );
}
