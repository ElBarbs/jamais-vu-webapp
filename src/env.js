import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]),
    CLOUDANT_URL: z.string().min(1),
    CLOUDANT_APIKEY: z.string().min(1),
    COS_ENDPOINT: z.string().min(1),
    COS_APIKEY: z.string().min(1),
    COS_RESOURCE_INSTANCE_ID: z.string().min(1),
    COS_HMAC_KEY: z.string().min(1),
    COS_HMAC_SECRET: z.string().min(1),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    CLOUDANT_URL: process.env.CLOUDANT_URL,
    CLOUDANT_APIKEY: process.env.CLOUDANT_APIKEY,
    COS_ENDPOINT: process.env.COS_ENDPOINT,
    COS_APIKEY: process.env.COS_APIKEY,
    COS_RESOURCE_INSTANCE_ID: process.env.COS_RESOURCE_INSTANCE_ID,
    COS_HMAC_KEY: process.env.COS_HMAC_KEY,
    COS_HMAC_SECRET: process.env.COS_HMAC_SECRET,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
