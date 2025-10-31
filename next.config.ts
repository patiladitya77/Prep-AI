import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Skip linting during build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Skip TypeScript errors during build (optional)
    ignoreBuildErrors: true,
  },
  images: {
    // Disable image optimization to avoid sharp issues
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Exclude MediaPipe from webpack bundling on client side (use CDN instead)
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@mediapipe/face_mesh': false,
        '@mediapipe/camera_utils': false,
      };
    }
    return config;
  },
};

export default nextConfig;
