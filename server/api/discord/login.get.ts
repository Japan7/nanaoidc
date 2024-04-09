export default eventHandler(async (event) => {
  const params = getQuery(event);
  const session = await useSession(event, {
    password: process.env.SESSION_PASSWORD,
  });
  await session.update({ redirect: params.redirect });

  const authUrl = getAuthorizationUrl({
    scope: "identify email guilds guilds.members.read",
    prompt: "none",
  });
  return sendRedirect(event, authUrl);
});
