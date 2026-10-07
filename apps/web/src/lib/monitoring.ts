import * as Sentry from "@sentry/nextjs";
export function initializeMonitoring(dsn: string | undefined) {
  if (!dsn) return;
  Sentry.init({ dsn, dataCollection: { userInfo: false, cookies: false, httpHeaders: false, httpBodies: [], urlQueryParams: false, genAI: { inputs: false, outputs: false }, graphQL: { document: false, variables: false }, databaseQueryData: false, stackFrameVariables: false, frameContextLines: 0 }, tracesSampleRate: .05, defaultIntegrations: false, beforeSend(event) {
    // Workspace content, URLs, tokens and provider error bodies must not enter telemetry.
    delete event.user; delete event.request; delete event.breadcrumbs; delete event.extra;
    if (event.exception?.values) event.exception.values = event.exception.values.map(value => ({ type: value.type, value: "Workspace operation failed", stacktrace: value.stacktrace }));
    return event;
  } });
}
export function reportFailure(category: "route" | "webgl" | "collaboration", error?: unknown) {
  Sentry.captureException(new Error(`Flowboard ${category} failure`), { tags: { category, kind: error instanceof Error ? error.name : "unknown" } });
}
export function recordDuration(operation: "canvas.longtask" | "collaboration.sync" | "webgl.frame", duration: number) {
  if (!Number.isFinite(duration) || duration < 0) return;
  Sentry.startSpan({ name: operation, op: "ui.performance", attributes: { "duration.ms": Math.round(duration) } }, () => {});
}
