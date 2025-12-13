import { treaty } from "@elysiajs/eden";
import type { app } from "../app/api/[[...slugs]]/route";

const baseUrl =
  typeof window === "undefined"
    ? process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000"
    : window.location.origin;

export const api = treaty<app>(baseUrl).api;
