/**
 * React worker-view command for listing saved Wi-Fi networks and copying passwords.
 */
import {
	Action,
	ActionPanel,
	Detail,
	Icon,
	List,
	showToast,
	Toast,
} from "@kunkunsh/sdk/raycast";
import { useCachedPromise } from "@kunkunsh/sdk/utils";
import QRCode from "qrcode";
import { listWifiNetworks, readWifiPassword, type WifiNetwork, type WifiPassword } from "./wifi";

type WifiPasswordDetail = WifiPassword & {
	readonly qrSvg: string;
};

async function loadPasswordDetail(network: WifiNetwork): Promise<WifiPasswordDetail> {
	const detail = await readWifiPassword(network);
	const qrSvg = await QRCode.toString(detail.connectUrl, {
		type: "svg",
		margin: 1,
		width: 260,
	});
	return { ...detail, qrSvg };
}

async function loadPasswordDetailFromHook(network: unknown): Promise<WifiPasswordDetail> {
	if (!network || typeof network !== "object" || !("ssid" in network) || typeof network.ssid !== "string") {
		throw new Error("Missing Wi-Fi network");
	}
	const selected: WifiNetwork = {
		ssid: network.ssid,
		isCurrent: "isCurrent" in network && network.isCurrent === true,
		...("password" in network && typeof network.password === "string" ? { password: network.password } : {}),
	};
	return loadPasswordDetail(selected);
}

function markdownFor(detail: WifiPasswordDetail): string {
	return [
		`# ${detail.ssid}`,
		"",
		'<div style="display:flex;justify-content:center;margin:16px 0;">',
		detail.qrSvg,
		"</div>",
		"",
		"## Password",
		"",
		"```text",
		detail.password,
		"```",
		"",
		"## Wi-Fi QR Payload",
		"",
		"```text",
		detail.connectUrl,
		"```",
	].join("\n");
}

function WifiDetail({ network }: { readonly network: WifiNetwork }) {
	const { data, error, isLoading, revalidate } = useCachedPromise(loadPasswordDetailFromHook, [network], {
		keepPreviousData: true,
	});

	if (error) {
		return (
			<Detail
				markdown={`# ${network.ssid}\n\n${error.message}`}
				actions={
					<ActionPanel>
						<Action
							title="Try Again"
							icon={Icon.ArrowClockwise}
							onAction={() => {
								revalidate();
								void showToast({ title: "Reading Wi-Fi password", style: Toast.Style.Animated });
							}}
						/>
					</ActionPanel>
				}
			/>
		);
	}

	return (
		<Detail
			isLoading={isLoading}
			markdown={data ? markdownFor(data) : `# ${network.ssid}\n\nReading password...`}
			metadata={
				data && (
					<Detail.Metadata>
						<Detail.Metadata.Label title="SSID" text={data.ssid} />
						<Detail.Metadata.Label title="Password" text={data.password} />
					</Detail.Metadata>
				)
			}
			actions={
				data && (
					<ActionPanel>
						<Action.CopyToClipboard title="Copy Password" content={data.password} concealed />
						<Action.CopyToClipboard title="Copy Wi-Fi QR Payload" content={data.connectUrl} />
						<Action
							title="Refresh Password"
							icon={Icon.ArrowClockwise}
							onAction={() => {
								revalidate();
								void showToast({ title: "Reading Wi-Fi password", style: Toast.Style.Animated });
							}}
						/>
					</ActionPanel>
				)
			}
		/>
	);
}

export default function WifiPasswordCommand() {
	const { data, error, isLoading, revalidate } = useCachedPromise(listWifiNetworks);

	return (
		<List
			isLoading={isLoading}
			searchBarPlaceholder="Search saved Wi-Fi networks"
		>
			{error && (
				<List.EmptyView
					title="Could not list Wi-Fi networks"
					description={error.message}
					icon={Icon.ExclamationMark}
				/>
			)}
			<List.Section title="Wi-Fi Networks" subtitle={`${data?.length ?? 0} saved`}>
				{(data ?? []).map((network) => (
					<List.Item
						key={network.ssid}
						title={network.ssid}
						subtitle={network.isCurrent ? "Current network" : undefined}
						icon={network.isCurrent ? Icon.FullSignal : Icon.Network}
						accessories={network.password ? [{ text: "password loaded" }] : []}
						actions={
							<ActionPanel>
								<Action.Push title="Show Password & QR" target={<WifiDetail network={network} />} />
								<Action
									title="Refresh Networks"
									icon={Icon.ArrowClockwise}
									onAction={() => {
										revalidate();
										void showToast({ title: "Refreshing Wi-Fi networks", style: Toast.Style.Animated });
									}}
								/>
							</ActionPanel>
						}
					/>
				))}
			</List.Section>
		</List>
	);
}
