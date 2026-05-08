import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { mochaPlugins, type MochaEnv } from "@getmocha/vite-plugins";

const mochaEnv: MochaEnv = {
  APP_ID: process.env.APP_ID,
  APP_URL: process.env.APP_URL,
  ORIGIN: process.env.ORIGIN,
  SHOW_WATERMARK: process.env.SHOW_WATERMARK,
  NODE_ENV: process.env.NODE_ENV,
  PLUGINS: process.env.PLUGINS,
  DEBUG_LOGS: process.env.DEBUG_LOGS,
  ANALYTICS_SCRIPT_ATTRS: process.env.ANALYTICS_SCRIPT_ATTRS,
};

export default defineConfig({
	  plugins: [
	    ...mochaPlugins(mochaEnv),
	    react(),
	  ],
	  server: {
	    allowedHosts: true,
	  },
  build: {
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router"],
          charts: ["framer-motion"],
          icons: ["lucide-react"],
          ui: ["class-variance-authority", "clsx", "tailwind-merge"],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@user": path.resolve(__dirname, "./src/modules/user/src"),
      "@vendor": path.resolve(__dirname, "./src/modules/vendor/src"),
      "@admin": path.resolve(__dirname, "./src/modules/admin/src"),
    },
  },
});
