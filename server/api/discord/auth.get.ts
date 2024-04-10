import assert from "node:assert/strict";

export default eventHandler(async (event) => {
  const query = getQuery(event);
  const { redirect } = query;
  assert(typeof redirect === "string");

  const session = await useTypedSession(event);
  await session.update({ redirect });

  const authUrl = getAuthorizationUrl({
    scope: "identify email guilds guilds.members.read",
    prompt: "none",
  });
  return sendRedirect(event, authUrl);
});
