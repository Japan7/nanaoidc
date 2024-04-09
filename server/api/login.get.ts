export default eventHandler((event) => {
  sendRedirect(
    event,
    getAuthorizationUrl({
      scope: "identify email guilds guilds.members.read",
      prompt: "none",
    })
  );
});
