import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { CloudantV1, IamAuthenticator } from "@ibm-cloud/cloudant";
import { Credentials, S3 } from "ibm-cos-sdk";
import { fileTypeFromBuffer } from "file-type";
import { nanoid } from "nanoid";
import type { FeatureCollection, Geometry, GeoJsonProperties } from "geojson";

import { env } from "~/env";
import { createTRPCRouter, publicProcedure } from "../trpc";
import type { RecordingDocument } from "~/lib/definition";

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
  credentials: new Credentials(env.COS_HMAC_KEY, env.COS_HMAC_SECRET),
  signatureVersion: "v4",
};

const cos = new S3(cosConfig);

export const ibmRouter = createTRPCRouter({
  getRandomRecording: publicProcedure.query(async () => {
    const documents = await cloudant.postAllDocs({
      db: "jamaisvu-recordings",
      includeDocs: true,
    });

    const randomIndex = Math.floor(Math.random() * documents.result.totalRows);
    const randomDocument = documents.result.rows[randomIndex]?.doc as
      | RecordingDocument
      | undefined;

    if (randomDocument) {
      const presignedURL = await cos.getSignedUrlPromise("getObject", {
        Bucket: "recordings",
        Key: `${randomDocument.filename}`,
        Expires: 30,
      });

      if (presignedURL) {
        return presignedURL;
      } else {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Failed to retrieve audio file.",
        });
      }
    }
  }),
  getLocationData: publicProcedure.query(async () => {
    const documents = await cloudant.postAllDocs({
      db: "jamaisvu-recordings",
      includeDocs: true,
    });

    const locationData = documents.result.rows
      .map((row) => row.doc as RecordingDocument)
      .map((doc) => ({
        latitude: doc.location.latitude,
        longitude: doc.location.longitude,
      }));

    const resp: FeatureCollection<Geometry, GeoJsonProperties> = {
      type: "FeatureCollection",
      features: locationData.map((item) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [item.longitude, item.latitude],
        },
        properties: {},
      })),
    };

    return resp;
  }),
  uploadRecordingMetadata: publicProcedure
    .input(
      z.object({
        id: z.string(),
        location: z.optional(z.custom<GeolocationPosition>()),
      }),
    )
    .mutation(async ({ input }) => {
      const response = await cloudant.postDocument({
        db: "jamaisvu-recordings",
        document: {
          filename: `${input.id}.wav`,
          location: {
            latitude: input.location?.coords.latitude,
            longitude: input.location?.coords.longitude,
          },
          timestamp: Date.now(),
        },
      });

      return response;
    }),
  uploadRecording: publicProcedure
    .input(z.object({ base64: z.string() }))
    .mutation(async ({ input }) => {
      const buffer = Buffer.from(input.base64, "base64");
      const fileType = await fileTypeFromBuffer(buffer);

      if (!fileType?.mime.startsWith("audio")) {
        throw new TRPCError({
          code: "UNSUPPORTED_MEDIA_TYPE",
          message: "Only audio files are supported.",
        });
      }

      const id = nanoid();
      const params = {
        Bucket: "recordings",
        Key: `${id}.wav`,
        Body: buffer,
      };

      await cos.putObject(params).promise();

      return id;
    }),
});
