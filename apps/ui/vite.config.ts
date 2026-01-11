import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		visualizer({
			open: true,
			filename: "dist/stats.html",
			gzipSize: true,
			brotliSize: true,
		}),
	],
	resolve: {
		alias: [{ find: "@", replacement: "/src" }],
	},
	server: {
		proxy: {
			"/api": {
				target: "http://localhost:8000",
				changeOrigin: true,
			},
		},
	},
});
