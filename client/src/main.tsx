import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App";
import "./index.css";

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    beforeSend(event) {
      if (import.meta.env.MODE === "development") return null;
      return event;
    },
  });
}

createRoot(document.getElementById("root")!).render(
  <Sentry.ErrorBoundary fallback={({ error }) => {
    console.error("Unhandled error:", error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">🛡️</div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">
            Something went wrong
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Please refresh and try again. If the issue persists, contact support.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition-colors min-h-[44px]"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }}>
    <App />
  </Sentry.ErrorBoundary>
);
