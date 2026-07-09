/**
 * Public Wi-Fi service implementation backed by scoped host shell commands.
 */
import { implementService } from "@kunkunsh/sdk/runtime";
import {
	listWifiNetworks,
	readWifiPassword,
	wifiConnectUrl,
} from "./wifi";
import { wifiContract, type WifiNetwork } from "./services";

async function readPasswordBestEffort(network: WifiNetwork): Promise<WifiNetwork> {
	try {
		const detail = await readWifiPassword(network);
		return { ...network, password: detail.password };
	} catch {
		return network;
	}
}

export default implementService(wifiContract, {
	async listNetworks(input) {
		const networks = await listWifiNetworks();
		if (input.includePasswords !== true) return { networks };
		return { networks: await Promise.all(networks.map(readPasswordBestEffort)) };
	},

	async readPassword(input) {
		return readWifiPassword({ ssid: input.ssid, isCurrent: false });
	},

	async buildConnectUrl(input) {
		return { connectUrl: wifiConnectUrl(input.ssid, input.password) };
	},
});
