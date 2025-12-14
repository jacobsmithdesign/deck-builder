import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "onnxruntime-node": false,
      "onnxruntime-node/dist": false,
      "onnxruntime-web": false,
    };

    //
    // Block fs, path, os, etc.
    //
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      fs: false,
      path: false,
      os: false,
    };
    return config;
  },
  env: {
    TRANSFORMERS_JS_BACKEND: process.env.TRANSFORMERS_JS_BACKEND || "wasm",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cards.scryfall.io",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
