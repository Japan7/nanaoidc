import { RESTPostOAuth2AccessTokenResult } from "discord-api-types/v10";

export const config = {
  clientId: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  redirectUri: `${process.env.PUBLIC_URL}/api/discord/callback`,
  authorizationEndpoint: "https://discord.com/oauth2/authorize",
  tokenEndpoint: "https://discord.com/api/oauth2/token",
  revocationEndpoint: "https://discord.com/api/oauth2/token/revoke",
};

export function getAuthorizationUrl(params: Record<string, string> = {}) {
  const _params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    ...params,
  });
  return `${config.authorizationEndpoint}?${_params}`;
}

export async function exchangeCode(
  code: string
): Promise<RESTPostOAuth2AccessTokenResult> {
  const response = await fetch(config.tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: config.redirectUri,
    }),
  });
  return await response.json();
}
