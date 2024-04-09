import { readFileSync } from "node:fs";
import type { ClientMetadata } from "oidc-provider";

export interface UserConfig {
  publicUrl: string;
  sessionPassword: string;
  discord: {
    clientId: string;
    clientSecret: string;
    guildId: string;
  };
  clients: ClientMetadata[];
}

function readConfig(): UserConfig {
  console.log("Reading config from file");
  return JSON.parse(readFileSync("nanaoidc.json", "utf-8"));
}

export const userConfig: UserConfig = readConfig();
