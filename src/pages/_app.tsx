import { Lato } from "next/font/google";
import { type AppType } from "next/app";

import { api } from "~/utils/api";

import "~/styles/globals.css";

const lato = Lato({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-lato",
});

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <div className={`${lato.variable} font-sans`}>
      <Component {...pageProps} />
    </div>
  );
};

export default api.withTRPC(MyApp);
