/**
 * Builds the Wi-Fi Password React worker-view command.
 */
import { dedupeReact, kunkunCommandPlugin } from "@kunkunsh/sdk/build";
import type { BunPlugin } from "bun";

const result = await Bun.build({
	entrypoints: ["./src/index.tsx"],
	outdir: "./dist",
	naming: "[name].js",
	target: "browser",
	format: "esm",
	minify: false,
	sourcemap: "external",
	plugins: [kunkunCommandPlugin({ mode: "view" }) as BunPlugin, dedupeReact(import.meta.dir)],
});

if (!result.success) {
	console.error("Worker-view build failed:");
	for (const log of result.logs) {
		console.error(log);
	}
	process.exit(1);
}

console.log("Built:", result.outputs.map((output) => output.path).join(", "));
