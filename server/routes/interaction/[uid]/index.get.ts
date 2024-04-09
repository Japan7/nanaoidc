export default eventHandler(async (event) => {
  const { req, res } = event.node;
  const interaction = await oidc.interactionDetails(req, res);

  switch (interaction.prompt.name) {
    case "login":
      const params = new URLSearchParams({
        redirect: event.path + "/callback",
      });
      return sendRedirect(event, `/api/discord/login?${params}`);

    case "consent":
      return sendRedirect(event, event.path + "/consent");

    default:
      return interaction;
  }
});
