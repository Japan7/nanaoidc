import type { Snowflake } from "discord-api-types/globals";
import { readFileSync } from "node:fs";
import type { ClientMetadata, JWKS } from "oidc-provider";

export interface UserConfig {
  publicUrl: string;
  sessionPassword: string;
  redisUrl: string;
  oidc: {
    cookies: {
      keys: (string | Buffer)[];
    };
    jwks: JWKS;
  };
  baseGroup: string;
  discord: {
    clientId: string;
    clientSecret: string;
    guildId: Snowflake;
    roles: Record<Snowflake, string>;
  };
  forwardAuth: {
    hosts: Record<string, string[]>;
  };
  clients: ClientMetadata[];
}

function readConfig(): UserConfig {
  console.log("Reading config from file");
  return JSON.parse(readFileSync("nanaoidc.json", "utf-8"));
}

export const userConfig: UserConfig = readConfig();
