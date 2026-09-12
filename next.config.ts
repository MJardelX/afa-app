import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // The dev server answers internal (HMR) assets with 403 when the page is
  // opened from an origin it does not expect. Serving the app from 127.0.0.1
  // instead of localhost used to break hot reload.
  allowedDevOrigins: ["127.0.0.1", "localhost"],

  // Server Actions: on Vercel the built-in Origin===Host check already blocks
  // cross-site CSRF. If the app is ever deployed behind a proxy with a
  // different public host, list it here:
  //   experimental: { serverActions: { allowedOrigins: ["app.example.com"] } }

  // Static headers for every route (the CSP with its per-request nonce lives
  // in the middleware — it can't be static).
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          { key: "X-DNS-Prefetch-Control", value: "off" },
        ],
      },
    ];
  },

  // Guardians moved under Players; categories and the audit log under Settings.
  // Keep the old URLs working (bookmarks, muscle memory).
  async redirects() {
    return [
      { source: "/tutors", destination: "/players/tutors", permanent: true },
      {
        source: "/tutors/:path*",
        destination: "/players/tutors/:path*",
        permanent: true,
      },
      { source: "/categories", destination: "/settings/categories", permanent: true },
      { source: "/audit", destination: "/settings/audit", permanent: true },
    ];
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
