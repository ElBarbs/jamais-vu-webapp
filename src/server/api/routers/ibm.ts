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

const cleanString = (str: string) => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "");
};

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
  getRecording: publicProcedure.input(z.string()).query(async ({ input }) => {
    const audioFile = await cos
      .getObject({
        Bucket: "recordings",
        Key: `${input}`,
      })
      .promise();

    const body = audioFile.Body?.toString("base64");

    if (audioFile) {
      return body;
    } else {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Failed to retrieve audio file.",
      });
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
        timestamp: doc.timestamp,
        filename: doc.filename,
      }));

    const resp: FeatureCollection<Geometry, GeoJsonProperties> = {
      type: "FeatureCollection",
      features: locationData.map((item) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [item.longitude, item.latitude],
        },
        properties: {
          filename: item.filename,
          date: `${new Date(item.timestamp).toLocaleString()}`,
        },
      })),
    };

    return resp;
  }),
  uploadRecording: publicProcedure
    .input(
      z.object({
        base64: z.string(),
        ip: z.string(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const buffer = Buffer.from(input.base64, "base64");
      const fileType = await fileTypeFromBuffer(buffer);

      if (!fileType?.mime.startsWith("audio")) {
        throw new TRPCError({
          code: "UNSUPPORTED_MEDIA_TYPE",
          message: "Only audio files are supported.",
        });
      }

      const dateObject = new Date();
      // Date in format YYYY/MM/DD
      const date = dateObject.toISOString().split("T")[0]?.replace(/-/g, "/");
      // Time in format HH:MM:SS
      const time = dateObject.toTimeString().split(" ")[0];

      const filename = `${time}-${nanoid(6)}`;

      let s3FullName = "";
      let response = {};

      // If the client did not provide geolocation data, get it from the IP address.
      if (!input.latitude || !input.longitude) {
        try {
          const data = await fetch(`http://ip-api.com/json/${input.ip}`).then(
            async (res) => {
              return (await res.json()) as {
                city: string;
                lat: number;
                lon: number;
              };
            },
          );

          const { city, lat, lon } = data;

          // Set full name for S3 bucket.
          s3FullName = `${cleanString(city)}/${date}/${filename}`;

          // Save the document to Cloudant.
          response = await cloudant.postDocument({
            db: "jamaisvu-recordings",
            document: {
              _id: filename,
              filename: `${filename}.wav`,
              location: {
                city: city,
                latitude: lat,
                longitude: lon,
              },
              isClientGeolocation: false,
              timestamp: dateObject.getTime(),
            },
          });
        } catch (error) {
          console.error(error);
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid IP address.",
          });
        }
      } else {
        // Get the city.
        const city = await getCityFromGeolocation(
          input.latitude,
          input.longitude,
        );

        // Set full name for S3 bucket.
        s3FullName = `${cleanString(city)}/${date}/${filename}`;

        // Save the document to Cloudant.
        response = await cloudant.postDocument({
          db: "jamaisvu-recordings",
          document: {
            _id: filename,
            filename: `${filename}.wav`,
            location: {
              city: city,
              latitude: input.latitude,
              longitude: input.longitude,
            },
            isClientGeolocation: true,
            timestamp: dateObject.getTime(),
          },
        });
      }

      // Set the parameters for the S3 bucket.
      const params = {
        Bucket: "recordings",
        Key: `${s3FullName}.wav`,
        Body: buffer,
      };

      // Upload the audio file to the S3 bucket.
      await cos.putObject(params).promise();

      // Return the response from Cloudant.
      return response as CloudantV1.DocumentResult;
    }),
});

async function getCityFromGeolocation(lat: number, lon: number) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`,
  );
  const data = (await res.json()) as { address: { city: string } };
  return data.address.city;
}
