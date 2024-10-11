import { CloudantV1, IamAuthenticator } from "@ibm-cloud/cloudant";

import { env } from "~/env";
import { createTRPCRouter, publicProcedure } from "../trpc";

const authenticator = new IamAuthenticator({
  apikey: env.CLOUDANT_APIKEY,
});

const client = new CloudantV1({
  authenticator,
  serviceUrl: env.CLOUDANT_URL,
});

export const ibmRouter = createTRPCRouter({
  getRecordings: publicProcedure.query(async () => {
    const recordings = await client.postFind({
      db: "jamaisvu-recordings",
      selector: {},
    });
    return recordings.result.docs;
  }),
});
