import assert from "node:assert/strict";
import { userConfig } from "~/utils/config";
import { exchangeCode, fetchUserinfo } from "~/utils/discord";
import { useTypedSession } from "~/utils/session";

export default eventHandler(async (event) => {
  const session = await useTypedSession(event);
  const query = getQuery(event);
  const { code, proto, host, uri } = query;
  if (host) {
    await session.update({ redirect: `${proto}://${host}${uri}` });
    const params = new URLSearchParams({ redirect: `http://${host}/_oauth` });
    return sendRedirect(
      event,
      `${userConfig.publicUrl}/discord/auth?${params}`
    );
  } else if (code) {
    assert(typeof code === "string");
    const resp = await exchangeCode(code);
    const { member } = await fetchUserinfo(resp.access_token);
    const groups = [userConfig.baseGroup];
    for (const role of member.roles) {
      const mapped = userConfig.discord.roles[role];
      if (mapped) {
        groups.push(mapped);
      }
    }
    await session.update({
      forwardAuthGroups: groups,
      forwardAuthExpires: Date.now() + 1000 * 60 * 60 * 24,
    });
    return sendRedirect(event, session.data.redirect || "/");
  } else {
    throw createError({ status: 400, message: "Missing required query" });
  }
});
