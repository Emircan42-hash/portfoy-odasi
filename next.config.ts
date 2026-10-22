import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pilot sürümde Cache Components kapalı: her panel ve oda sayfası istek anında
  // veritabanından okur, Suspense sınırı zorunluluğu yok. Faz 2'de açılabilir.
  cacheComponents: false,
  images: {
    // Fotoğraflar şimdilik dış URL'lerden (ileride kendi S3 deposu)
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
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
