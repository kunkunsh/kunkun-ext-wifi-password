/**
 * Builds the Wi-Fi Password React worker-view command.
 */
import { dedupeReact, kunkunCommandPlugin } from "@kunkunsh/sdk/build";
import type { BunPlugin } from "bun";

async function build(label: string, options: Bun.BuildConfig): Promise<void> {
	const result = await Bun.build(options);
	if (!result.success) {
		console.error(`${label} build failed:`);
		for (const log of result.logs) {
			console.error(log);
		}
		process.exit(1);
	}
	console.log(`Built ${label}:`, result.outputs.map((output) => output.path).join(", "));
}

await build("Wi-Fi service", {
	entrypoints: ["./src/WifiService.ts"],
	outdir: "./dist",
	naming: "[name].js",
	target: "node",
	format: "esm",
	minify: false,
	sourcemap: "external",
	plugins: [kunkunCommandPlugin({ mode: "service" }) as BunPlugin],
});

await build("Wi-Fi Password worker-view", {
	entrypoints: ["./src/index.tsx"],
	outdir: "./dist",
	naming: "[name].js",
	target: "browser",
	format: "esm",
	minify: false,
	sourcemap: "external",
	plugins: [kunkunCommandPlugin({ mode: "view" }) as BunPlugin, dedupeReact(import.meta.dir)],
});
