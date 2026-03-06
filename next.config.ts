import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Server can load onnxruntime-node for /api/embed (Transformers.js in Node)
  serverExternalPackages: ["@huggingface/transformers", "onnxruntime-node"],

  webpack: (config, { isServer }) => {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    config.resolve.alias = {
      ...config.resolve.alias,
      sharp$: false,
      // Only exclude onnxruntime-node from client bundle; server uses it for /api/embed
      ...(isServer ? {} : { "onnxruntime-node$": false }),
    };
    return config;
  },

  // Setting a blank turbopack config to stop build error
  turbopack: {},
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
