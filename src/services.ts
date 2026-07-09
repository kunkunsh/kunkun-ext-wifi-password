/**
 * Public Wi-Fi service contract for saved network discovery and password lookup.
 * Service access is the explicit consent boundary for exposing saved Wi-Fi credentials.
 */
import { defineServiceContract, method, type InferService } from "@kunkunsh/sdk/contract";
import type { SchemaMap, ServiceMap } from "@kunkunsh/sdk/runtime";
import * as v from "valibot";

const NonEmptyString = v.pipe(v.string(), v.nonEmpty());

export const WifiNetworkSchema = v.object({
	ssid: NonEmptyString,
	isCurrent: v.boolean(),
	password: v.optional(v.string()),
});

export const WifiPasswordSchema = v.object({
	ssid: NonEmptyString,
	password: v.string(),
	connectUrl: v.string(),
});

export const ListNetworksInputSchema = v.object({
	includePasswords: v.optional(v.boolean()),
});

export const ListNetworksOutputSchema = v.object({
	networks: v.array(WifiNetworkSchema),
});

export const ReadPasswordInputSchema = v.object({
	ssid: NonEmptyString,
});

export const BuildConnectUrlInputSchema = v.object({
	ssid: NonEmptyString,
	password: v.string(),
});

export const BuildConnectUrlOutputSchema = v.object({
	connectUrl: v.string(),
});

export const wifiContract = defineServiceContract({
	id: "wifi-password/wifi@1",
	serviceName: "wifi",
	description: "Saved Wi-Fi network discovery, password lookup, and QR payload generation",
	methods: {
		listNetworks: method({
			description: "List saved Wi-Fi network SSIDs, optionally best-effort including passwords",
			input: ListNetworksInputSchema,
			output: ListNetworksOutputSchema,
		}),
		readPassword: method({
			description: "Read the saved password for one Wi-Fi SSID",
			input: ReadPasswordInputSchema,
			output: WifiPasswordSchema,
		}),
		buildConnectUrl: method({
			description: "Build a Wi-Fi QR payload from SSID and password",
			input: BuildConnectUrlInputSchema,
			output: BuildConnectUrlOutputSchema,
		}),
	},
});

export const wifiServiceSchemas = {
	wifi: {
		listNetworks: {
			input: ListNetworksInputSchema,
			output: ListNetworksOutputSchema,
		},
		readPassword: {
			input: ReadPasswordInputSchema,
			output: WifiPasswordSchema,
		},
		buildConnectUrl: {
			input: BuildConnectUrlInputSchema,
			output: BuildConnectUrlOutputSchema,
		},
	},
} satisfies SchemaMap;

export type WifiNetwork = v.InferOutput<typeof WifiNetworkSchema>;
export type WifiPassword = v.InferOutput<typeof WifiPasswordSchema>;
export type WifiService = InferService<typeof wifiContract>;

export type WifiServiceMap = {
	wifi: {
		listNetworks: {
			input: v.InferInput<typeof ListNetworksInputSchema>;
			output: v.InferOutput<typeof ListNetworksOutputSchema>;
		};
		readPassword: {
			input: v.InferInput<typeof ReadPasswordInputSchema>;
			output: v.InferOutput<typeof WifiPasswordSchema>;
		};
		buildConnectUrl: {
			input: v.InferInput<typeof BuildConnectUrlInputSchema>;
			output: v.InferOutput<typeof BuildConnectUrlOutputSchema>;
		};
	};
} & ServiceMap;
