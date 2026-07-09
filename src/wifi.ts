/**
 * Cross-platform Wi-Fi password helpers.
 * All system access goes through the Kunkun host shell API with scoped command permissions.
 */
import { shell } from "@kunkunsh/sdk";
import type { WifiNetwork, WifiPassword } from "./services";

function requireSuccess(program: string, result: Awaited<ReturnType<typeof shell.execute>>): string {
	if (result.code !== 0) {
		throw new Error(result.stderr.trim() || `${program} exited with code ${String(result.code)}`);
	}
	return result.stdout;
}

function unique(values: readonly string[]): string[] {
	return [...new Set(values.filter((value) => value.length > 0))];
}

function parseWindowsCurrentSsid(stdout: string): string | undefined {
	for (const line of stdout.split(/\r?\n/)) {
		const match = /^\s*SSID\s*:\s*(.+?)\s*$/.exec(line);
		if (match) return match[1];
	}
	return undefined;
}

function parseWindowsProfiles(stdout: string): string[] {
	return unique(
		stdout
			.split(/\r?\n/)
			.flatMap((line) => {
				const match = /^\s*(?:All User Profile|User Profile)\s*:\s*(.+?)\s*$/.exec(line);
				return match ? [match[1]] : [];
			}),
	);
}

function parseWindowsPassword(stdout: string): string | undefined {
	for (const line of stdout.split(/\r?\n/)) {
		const match = /^\s*Key Content\s*:\s*(.+?)\s*$/.exec(line);
		if (match) return match[1];
	}
	return undefined;
}

function parseNmcliCurrent(stdout: string): WifiNetwork | undefined {
	const ssid = /^\s*SSID\s*:\s*(.+?)\s*$/m.exec(stdout)?.[1];
	const password = /^\s*Password\s*:\s*(.+?)\s*$/m.exec(stdout)?.[1];
	if (!ssid || !password) return undefined;
	return { ssid, password, isCurrent: true };
}

function escapeWifiField(value: string): string {
	return value.replace(/([\\;,:"])/g, "\\$1");
}

export function wifiConnectUrl(ssid: string, password: string): string {
	return `WIFI:T:WPA;S:${escapeWifiField(ssid)};P:${escapeWifiField(password)};;`;
}

function currentPlatform(): NodeJS.Platform {
	return process.platform;
}

async function listMacNetworks(): Promise<WifiNetwork[]> {
	const result = await shell.execute("networksetup", ["-listpreferredwirelessnetworks", "en0"]);
	const stdout = requireSuccess("networksetup", result);
	return unique(stdout.trim().split(/\r?\n/).slice(1).map((line) => line.trim())).map((ssid) => ({
		ssid,
		isCurrent: false,
	}));
}

async function listWindowsNetworks(): Promise<WifiNetwork[]> {
	const current = parseWindowsCurrentSsid(
		requireSuccess("netsh", await shell.execute("netsh", ["wlan", "show", "interfaces"])),
	);
	const profiles = parseWindowsProfiles(
		requireSuccess("netsh", await shell.execute("netsh", ["wlan", "show", "profiles"])),
	);
	return profiles.map((ssid) => ({ ssid, isCurrent: ssid === current }));
}

async function listLinuxNetworks(): Promise<WifiNetwork[]> {
	const result = await shell.execute("nmcli", ["device", "wifi", "show-password"]);
	const stdout = requireSuccess("nmcli", result);
	const current = parseNmcliCurrent(stdout);
	return current ? [current] : [];
}

export async function listWifiNetworks(): Promise<WifiNetwork[]> {
	const platform = currentPlatform();
	if (platform === "darwin") return listMacNetworks();
	if (platform === "win32") return listWindowsNetworks();
	if (platform === "linux") return listLinuxNetworks();
	throw new Error(`Unsupported platform: ${platform}`);
}

async function readMacPassword(ssid: string): Promise<string> {
	const result = await shell.execute("security", [
		"find-generic-password",
		"-D",
		"AirPort network password",
		"-a",
		ssid,
		"-w",
	]);
	return requireSuccess("security", result).trim();
}

async function readWindowsPassword(ssid: string): Promise<string> {
	const result = await shell.execute("netsh", ["wlan", "show", "profile", `name=${ssid}`, "key=clear"]);
	const password = parseWindowsPassword(requireSuccess("netsh", result));
	if (!password) throw new Error(`No password found for ${ssid}`);
	return password;
}

export async function readWifiPassword(network: WifiNetwork): Promise<WifiPassword> {
	const platform = currentPlatform();
	const password = network.password
		?? (platform === "darwin"
			? await readMacPassword(network.ssid)
			: platform === "win32"
				? await readWindowsPassword(network.ssid)
				: undefined);
	if (!password) throw new Error(`No password found for ${network.ssid}`);
	return {
		ssid: network.ssid,
		password,
		connectUrl: wifiConnectUrl(network.ssid, password),
	};
}
