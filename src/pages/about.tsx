import Head from "next/head";
import Header from "~/components/header";

export default function About() {
  return (
    <>
      <Head>
        <title>Jamais Vu - About</title>
        <meta name="description" content="About" />
      </Head>
      <Header />
      <main className="mx-8 my-4 flex flex-col items-center justify-start">
        <div className="container flex max-w-3xl flex-col items-center justify-center gap-8">
          <div className="flex flex-col gap-2">
            <p className="text-center text-xl font-bold sm:text-left">
              What Is This?
            </p>
            <p className="text-justify text-sm">
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
              Terms and Conditions
            </p>
            <p className="text-justify text-sm">
              By using this website and uploading an audio recording, you agree
              to share your geolocation data with us. Your information will not
              be shared with any third parties and will only be used to serve
              the purpose of this project.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
