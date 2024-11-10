import { type AppType } from "next/app";
import Head from "next/head";

import { supplyFont } from "~/styles/fonts/font-loader";
import { api } from "~/utils/api";

import "~/styles/globals.css";

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.png" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, user-scalable=no"
        />
      </Head>
      <div
        className={`${supplyFont.variable} font-supply bg-gray-950 text-gray-200`}
      >
        <Component {...pageProps} />
      </div>
    </>
  );
};

export default api.withTRPC(MyApp);
