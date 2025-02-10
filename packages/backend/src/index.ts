// filepath: /path/to/my-monorepo/packages/backend/src/index.ts
import express, { Request, Response } from "express";
import { createClient } from "redis";
import cors from "cors";

const app = express();
const port = 3001;

//const client = createClient();
// Redis connection configuration
const REDIS_URL = process.env.REDIS_URL || "redis://redis-service:6379";

// Create Redis client with explicit connection URL
const client = createClient({
  url: REDIS_URL,
});

client.on("error", (err) => console.error("Redis Client Error", err));
// Connection handling
client.on("connect", () => {
  console.log("Connected to Redis successfully");
});

client.on("reconnecting", () => {
  console.log("Reconnecting to Redis...");
});

app.use(cors()); // Enable CORS for all routes
app.use(express.json());

app.get("/user", async (req: Request, res: Response) => {
  const user = await client.get("user");
  res.json(JSON.parse(user || "{}"));
});

app.post("/user", async (req: Request, res: Response) => {
  const user = req.body;
  await client.set("user", JSON.stringify(user));
  res.status(201).send("User saved");
});

client.connect().then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});
