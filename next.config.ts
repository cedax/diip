import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['localhost', '127.0.0.1', 'shana-logiest-tamiko.ngrok-free.dev'],
};

export default nextConfig;
