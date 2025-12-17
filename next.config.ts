import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer }) => {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    if (!isServer) {
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        // Prevent Node-only deps from being bundled client-side
        sharp$: false,
        "onnxruntime-node$": false,

        // IMPORTANT: if you are using browser WASM, do NOT disable onnxruntime-web
        // (so remove your current "onnxruntime-web": false)
      };

      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        path: false,
        os: false,
      };
    }

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
