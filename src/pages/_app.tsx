import { type AppType } from "next/app";
import { Analytics } from "@vercel/analytics/react";
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
      <Analytics />
      <div
        className={`${supplyFont.variable} bg-gray-950 font-supply text-gray-200`}
      >
        <Component {...pageProps} />
      </div>
    </>
  );
};

export default api.withTRPC(MyApp);
