import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
