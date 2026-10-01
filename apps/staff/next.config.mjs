/** @type {import('next').NextConfig} */
const nextConfig = {
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
