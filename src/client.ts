/**
 * Typed self-service client for the Wi-Fi worker-view command.
 */
import { createValidatedServiceClient } from "@kunkunsh/sdk/runtime";
import { wifiServiceSchemas } from "./services";

export const wifi = createValidatedServiceClient("wifi-password", wifiServiceSchemas);
