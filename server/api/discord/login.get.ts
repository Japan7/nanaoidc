export default eventHandler(async (event) => {
  const authUrl = getAuthorizationUrl({
    scope: "identify email guilds guilds.members.read",
    prompt: "none",
  });
  return sendRedirect(event, authUrl);
});
