import path from "path";
import { fileURLToPath } from "url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@/components/ui/badge": path.resolve(__dirname, "./src/components/ui/Badge.jsx"),
      "@/components/ui/card": path.resolve(__dirname, "./src/components/ui/Card.jsx"),
      "@/components/ui/input": path.resolve(__dirname, "./src/components/ui/Input.jsx"),
      "@/components/ui/table": path.resolve(__dirname, "./src/components/ui/Table.jsx"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
