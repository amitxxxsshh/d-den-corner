const isProd = process.env.NODE_ENV === "production";
const apiUrl =
  process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes("localhost")
    ? process.env.NEXT_PUBLIC_API_URL
    : "https://api.soaiterbtech2024.workers.dev";

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: isProd
    ? {
        NEXT_PUBLIC_API_URL: apiUrl,
      }
    : {},
  async rewrites() {
    return [
      {
        source: "/staff/dashboard",
        destination: "/dashboard",
      },
      {
        source: "/staff/:path*",
        destination: "/:path*",
      },
    ];
  },
};

export default nextConfig;
