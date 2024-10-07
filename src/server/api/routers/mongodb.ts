import { MongoClient } from "mongodb";

import { env } from "~/env";
import { createTRPCRouter, publicProcedure } from "../trpc";

const client = await new MongoClient(env.MONGODB_URI, {
  appName: "jamaisvu",
}).connect();

export const mongodbRouter = createTRPCRouter({
  getMovies: publicProcedure.query(async () => {
    const db = client.db("sample_mflix");
    const movies = await db
      .collection("movies")
      .find()
      .sort({ metacritic: -1 })
      .limit(10)
      .toArray();
    return movies;
  }),
});
