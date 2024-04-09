import { REST } from "@discordjs/rest";
import {
  Routes,
  type RESTGetAPICurrentUserResult,
  type RESTGetCurrentUserGuildMemberResult,
} from "discord-api-types/v10";
import type { InteractionResults } from "oidc-provider";

export default eventHandler(async (event) => {
  const session = await useTypedSession(event);

  const resp = await exchangeCode(session.data.code);
  const rest = new REST({ authPrefix: "Bearer" }).setToken(resp.access_token);
  const [user, member] = (await Promise.all([
    rest.get(Routes.user()),
    rest.get(Routes.userGuildMember(process.env.GUILD_ID)),
  ])) as [
    user: RESTGetAPICurrentUserResult,
    member: RESTGetCurrentUserGuildMemberResult
  ];
  userStore.set(user.id, { user, member });

  const result: InteractionResults = {
    login: { accountId: user.id },
  };
  const { req, res } = event.node;
  const redirectTo = await oidc.interactionResult(req, res, result);
  return sendRedirect(event, redirectTo);
});
