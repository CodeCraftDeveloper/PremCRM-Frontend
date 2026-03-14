import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const vendorChunkGroups = [
  {
    name: "react-vendor",
    packages: ["react", "react-dom", "scheduler"],
  },
  {
    name: "router-redux",
    packages: [
      "react-router",
      "react-router-dom",
      "redux",
      "@reduxjs/toolkit",
      "react-redux",
    ],
  },
  {
    name: "forms-validation",
    packages: ["react-hook-form", "@hookform/resolvers", "zod"],
  },
  {
    name: "charts",
    packages: ["recharts", "victory-vendor", "d3-"],
  },
  {
    name: "icons",
    packages: ["lucide-react"],
  },
  {
    name: "networking",
    packages: [
      "axios",
      "socket.io-client",
      "engine.io-client",
      "socket.io-parser",
    ],
  },
];

const packageChunkName = (id) => {
  if (!id.includes("node_modules")) return null;

  for (const group of vendorChunkGroups) {
    if (group.packages.some((pkg) => id.includes(`/node_modules/${pkg}/`))) {
      return group.name;
    }
  }

  return "vendor";
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          return packageChunkName(id);
        },
      },
    },
  },
});
