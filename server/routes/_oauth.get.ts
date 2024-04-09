import assert from "node:assert/strict";

export default eventHandler(async (event) => {
  const session = await useTypedSession(event);
  const query = getQuery(event);
  const { code, forwardAuthRedirect } = query;
  if (forwardAuthRedirect) {
    assert(typeof forwardAuthRedirect === "string");
    await session.update({ redirect: ".", forwardAuthRedirect });
    return sendRedirect(event, `${userConfig.publicUrl}/api/discord/auth`);
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
    await session.update({ forwardAuthGroups: groups });
    return sendRedirect(event, session.data.forwardAuthRedirect);
  } else {
    throw createError({ status: 400, message: "Missing required query" });
  }
});
