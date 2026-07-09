/**
 * Source-level service tests for the Wi-Fi public contract.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "bun:test";
import type { KunkunManifest } from "@kunkunsh/sdk/manifest";
import { createTestHost, runServiceDefinition } from "@kunkunsh/plugin-test";
import service from "../src/WifiService";

const extensionDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(readFileSync(path.join(extensionDir, "package.json"), "utf8")) as {
	kunkun: KunkunManifest;
};

describe("wifi service", () => {
	test("builds escaped Wi-Fi QR payloads", async () => {
		const host = createTestHost({
			manifest: packageJson.kunkun,
			extensionDir,
		});
		const runner = runServiceDefinition(service, { host });
		const result = await runner.call("wifi", "buildConnectUrl", {
			ssid: "Cafe;Guest",
			password: "p,a:ss\"word",
		});
		expect(result).toEqual({
			connectUrl: 'WIFI:T:WPA;S:Cafe\\;Guest;P:p\\,a\\:ss\\"word;;',
		});
	});
});
