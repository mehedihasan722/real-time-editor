import { initializeMonitoring, reportFailure } from "./lib/monitoring";
initializeMonitoring(process.env.NEXT_PUBLIC_SENTRY_DSN);
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  window.addEventListener("error", event => reportFailure("route", event.error));
  window.addEventListener("unhandledrejection", event => reportFailure("route", event.reason));
}
