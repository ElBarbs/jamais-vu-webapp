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
    const recordings = await client.postAllDocs({
      db: "jamaisvu-recordings",
      includeDocs: true,
    });

    return recordings.result.rows
      .map((row) => row.doc)
      .filter((doc) => doc !== undefined);
  }),
});
