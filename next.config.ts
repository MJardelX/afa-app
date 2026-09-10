import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // The dev server answers internal (HMR) assets with 403 when the page is
  // opened from an origin it does not expect. Serving the app from 127.0.0.1
  // instead of localhost used to break hot reload.
  allowedDevOrigins: ["127.0.0.1", "localhost"],

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
