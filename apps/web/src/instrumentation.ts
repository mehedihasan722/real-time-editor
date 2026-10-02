import { initializeMonitoring, reportFailure } from "./lib/monitoring";
import { flush } from "@sentry/nextjs";
export function register() { initializeMonitoring(process.env.SENTRY_DSN); }
export async function onRequestError(error: unknown) { if (!process.env.SENTRY_DSN) return; reportFailure("route", error); await flush(2000); }
