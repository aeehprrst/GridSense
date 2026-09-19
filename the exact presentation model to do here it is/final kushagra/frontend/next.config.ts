import type { NextConfig } from "next";

/**
 * The API proxy.
 *
 * Every /api/* call is rewritten to the FastAPI backend so the browser only
 * ever talks to one origin. That is what keeps CORS out of the picture, and it
 * is the only arrangement the embedded GIS explorer can work with, because
 * public/gis/app.js builds its own relative /api/* URLs and cannot be told
 * about a different host.
 *
 * WHY THIS IS SO DEFENSIVE
 *
 * A rewrite destination is validated by the hosting platform when the
 * deployment is finalised, not when the build runs. So a bad value here does
 * not fail the build — it fails the deploy afterwards, with the build log
 * ending cleanly at "Deploying outputs...". That is a miserable thing to debug,
 * and there are two easy ways to trigger it:
 *
 *   1. BACKEND_URL is unset in the cloud, so the destination falls back to
 *      http://127.0.0.1:8000 — a loopback address the platform will not accept.
 *   2. BACKEND_URL is set but malformed: wrapped in quotes, with a trailing
 *      slash, or with whitespace from a copy-paste.
 *
 * So the value is sanitised, then validated, and if it is not a usable absolute
 * http(s) URL the rewrite is simply omitted. A deployment with no proxy still
 * works — the app detects the missing backend and shows its "displaying mock
 * demo data" banner — which is a far better failure than no deployment at all.
 */

/** Strip whitespace, surrounding quotes, and any trailing slashes. */
function clean(value: string | undefined): string {
  return (value ?? "")
    .trim()
    .replace(/^['"]+|['"]+$/g, "")
    .replace(/\/+$/, "")
    .trim();
}

// On a developer machine the backend is conventionally on :8000, so default to
// it. In the cloud there is no such thing, and defaulting to loopback is the
// bug described above — so there, an unset variable means no rewrite at all.
const isCloudBuild = Boolean(process.env.VERCEL);
const backend = clean(process.env.BACKEND_URL) || (isCloudBuild ? "" : "http://127.0.0.1:8000");

const isUsable = /^https?:\/\/[^\s/]+/i.test(backend);

if (isCloudBuild) {
  // Surfaces in the build log, so a misconfigured variable is visible there
  // rather than only as a failed deploy.
  console.log(
    isUsable
      ? `[gridsense] proxying /api/* to ${backend}`
      : "[gridsense] BACKEND_URL missing or invalid - /api/* proxy disabled, app will run on mock data",
  );
}

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async rewrites() {
    if (!isUsable) return [];
    return [{ source: "/api/:path*", destination: `${backend}/api/:path*` }];
  },
};

export default nextConfig;
