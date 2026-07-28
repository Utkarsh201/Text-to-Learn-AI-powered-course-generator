import { Client } from "@upstash/qstash";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.QSTASH_TOKEN) {
  console.warn('[QStash] QSTASH_TOKEN is not set. Job publishing will fail.');
}

const qstashClient = new Client({
  token: process.env.QSTASH_TOKEN,
});

export default qstashClient;
