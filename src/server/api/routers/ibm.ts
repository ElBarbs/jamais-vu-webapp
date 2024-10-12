import { z } from "zod";
import { CloudantV1, IamAuthenticator } from "@ibm-cloud/cloudant";
import { S3 } from "ibm-cos-sdk";

import { env } from "~/env";
import { createTRPCRouter, publicProcedure } from "../trpc";

const authenticator = new IamAuthenticator({
  apikey: env.CLOUDANT_APIKEY,
});

const cloudant = new CloudantV1({
  authenticator,
  serviceUrl: env.CLOUDANT_URL,
});

const cosConfig = {
  endpoint: env.COS_ENDPOINT,
  apiKeyId: env.COS_APIKEY,
  serviceInstanceId: env.COS_RESOURCE_INSTANCE_ID,
  signatureVersion: "iam",
};

const cos = new S3(cosConfig);

export const ibmRouter = createTRPCRouter({
  getRecordings: publicProcedure.query(async () => {
    const recordings = await cloudant.postAllDocs({
      db: "jamaisvu-recordings",
      includeDocs: true,
    });

    return recordings.result.rows
      .map((row) => row.doc)
      .filter((doc) => doc !== undefined);
  }),
  uploadRecording: publicProcedure
    .input(z.array(z.instanceof(Blob)))
    .mutation(async ({ input }) => {
      const params = {
        Bucket: "recordings",
        Key: "audio.wav",
        Body: new Uint8Array(await new Blob(input).arrayBuffer()),
      };

      const response = await cos.putObject(params).promise();

      return response;
    }),
});
