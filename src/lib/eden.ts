import { treaty } from "@elysiajs/eden";
import type { app } from "../app/api/[[...slugs]]/route";

// Use same-origin (works on localhost + Vercel)
export const api = treaty<app>("/api").api;
