import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const appName    = env.VITE_APP_NAME    || "FinTrack";
  const apiUrl     = env.VITE_API_URL     || "";
  const coingeckoUrl = env.VITE_COINGECKO_URL || "https://api.coingecko.com";

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["icons/*.png", "icons/*.svg"],
        manifest: {
          name: appName,
          short_name: appName,
          start_url: "/",
          display: "standalone",
          background_color: "#08080f",
          theme_color: "#08080f",
          orientation: "portrait",
          icons: [
            { src: "icons/money.svg", sizes: "192x192", type: "image/svg+xml" },
            {
              src: "icons/money.svg",
              sizes: "512x512",
              type: "image/svg+xml",
              purpose: "any maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          runtimeCaching: [
            ...(apiUrl ? [{
              urlPattern: new RegExp(`^${apiUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i"),
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "api-cache",
                expiration: { maxAgeSeconds: 1800 },
              },
            }] : [{
              urlPattern: /^https:\/\/script\.google\.com\/.*/i,
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "api-cache",
                expiration: { maxAgeSeconds: 1800 },
              },
            }]),
            {
              urlPattern: new RegExp(`^${coingeckoUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i"),
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "coingecko-cache",
                expiration: { maxAgeSeconds: 300 },
              },
            },
          ],
        },
      }),
    ],
  };
});
