import Head from "next/head";
import Header from "~/components/header";

export default function About() {
  return (
    <>
      <Head>
        <title>Jamais Vu - About</title>
        <meta name="description" content="About" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      <main className="m-8 flex flex-col items-center justify-start">
        <div className="container flex max-w-3xl flex-col items-center justify-center gap-8">
          <div className="flex flex-col gap-2">
            <p className="text-center text-xl font-bold sm:text-left">
              Overview
            </p>
            <p className="text-justify">
              Jamais Vu is an interactive installation project designed to evoke
              the sensation of unfamiliarity with familiar environments through
              soundscapes. The project collects and transforms crowdsourced
              audio samples from across Montreal, creating an immersive, sensory
              experience that challenges perceptions of urban spaces. Our aim is
              to engage participants in exploring and contributing to a living
              archive of the city&apos;s sounds, allowing them to reflect on the
              digitization of their environment.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-center text-xl font-bold sm:text-left">
              Concept
            </p>
            <p className="text-justify">
              The project takes inspiration from theories like Hauntology (Mark
              Fisher) and Hyperreality (Jean Baudrillard), exploring the ways in
              which familiar sounds can be distorted to create a sense of
              temporal and spatial dislocation. Through the use of generative
              soundscapes, visual projections, and physical installations,
              participants are invited to experience a hyperreal version of the
              city, prompting critical reflection on how technology mediates
              their everyday experiences.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
