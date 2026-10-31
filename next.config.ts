import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page reads the DB and session cookie; keep the classic dynamic model.
  cacheComponents: false,
  output: "standalone",
  serverExternalPackages: ["@libsql/client", "pdf-parse"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
