import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config) => {
    // See https://webpack.js.org/configuration/resolve/#resolvealias
    config.resolve.alias = {
      ...config.resolve.alias,
      sharp$: false,
      "onnxruntime-node$": false,
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
