import { REST } from "@discordjs/rest";
import {
  OAuth2Routes,
  RESTPostOAuth2AccessTokenResult,
  Routes,
  type RESTGetAPICurrentUserResult,
  type RESTGetCurrentUserGuildMemberResult,
} from "discord-api-types/v10";

export function getAuthorizationUrl(params: Record<string, string> = {}) {
  const _params = new URLSearchParams({
    client_id: userConfig.discord.clientId,
    redirect_uri: `${userConfig.publicUrl}/discord/callback`,
    response_type: "code",
    ...params,
  });
  return `${OAuth2Routes.authorizationURL}?${_params}`;
}

export async function exchangeCode(code: string) {
  const resp = await fetch(OAuth2Routes.tokenURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: userConfig.discord.clientId,
      client_secret: userConfig.discord.clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: `${userConfig.publicUrl}/discord/callback`,
    }),
  });
  const json = await resp.json();
  return json as RESTPostOAuth2AccessTokenResult;
}

export async function fetchUserinfo(accessToken: string) {
  const rest = new REST({ authPrefix: "Bearer" }).setToken(accessToken);
  const [user, member] = (await Promise.all([
    rest.get(Routes.user()),
    rest.get(Routes.userGuildMember(userConfig.discord.guildId)),
  ])) as [RESTGetAPICurrentUserResult, RESTGetCurrentUserGuildMemberResult];
  return { user, member };
}
