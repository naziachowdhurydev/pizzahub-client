import { MongoClient } from "mongodb";

const dbName = process.env.DB_NAME || "pizzahub";

type MongoGlobal = typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

function getUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is missing from environment variables.");
  return uri;
}

export function getMongoClientPromise(): Promise<MongoClient> {
  const globalForMongo = globalThis as MongoGlobal;
  if (globalForMongo._mongoClientPromise) return globalForMongo._mongoClientPromise;

  const client = new MongoClient(getUri());
  const promise = client.connect();
  globalForMongo._mongoClientPromise = promise;
  promise.catch(() => {
    globalForMongo._mongoClientPromise = undefined;
  });
  return promise;
}

export async function getMongoDb() {
  const connected = await getMongoClientPromise();
  return connected.db(dbName);
}
