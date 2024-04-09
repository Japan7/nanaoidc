import { RESTPostOAuth2AccessTokenResult } from "discord-api-types/v10";

const endpoints = {
  authorization: "https://discord.com/oauth2/authorize",
  token: "https://discord.com/api/oauth2/token",
  revocation: "https://discord.com/api/oauth2/token/revoke",
};

export function getAuthorizationUrl(params: Record<string, string> = {}) {
  const _params = new URLSearchParams({
    client_id: userConfig.discord.clientId,
    redirect_uri: `${userConfig.publicUrl}/api/discord/callback`,
    response_type: "code",
    ...params,
  });
  return `${endpoints.authorization}?${_params}`;
}

export async function exchangeCode(
  code: string
): Promise<RESTPostOAuth2AccessTokenResult> {
  const response = await fetch(endpoints.token, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: userConfig.discord.clientId,
      client_secret: userConfig.discord.clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: `${userConfig.publicUrl}/api/discord/callback`,
    }),
  });
  return await response.json();
}
