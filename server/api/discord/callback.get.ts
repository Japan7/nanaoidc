import { REST } from "@discordjs/rest";
import {
  Routes,
  type RESTGetAPICurrentUserResult,
  type RESTGetCurrentUserGuildMemberResult,
} from "discord-api-types/v10";

export default eventHandler(async (event) => {
  const params = getQuery(event);
  const { code } = params;
  if (typeof code !== "string") {
    throw createError({ status: 400, message: "Missing code" });
  }

  const resp = await exchangeCode(code);
  const rest = new REST({ authPrefix: "Bearer" }).setToken(resp.access_token);

  const [user, member] = (await Promise.all([
    rest.get(Routes.user()),
    rest.get(Routes.userGuildMember(process.env.GUILD_ID)),
  ])) as [
    user: RESTGetAPICurrentUserResult,
    member: RESTGetCurrentUserGuildMemberResult
  ];

  return { user, member };
});
