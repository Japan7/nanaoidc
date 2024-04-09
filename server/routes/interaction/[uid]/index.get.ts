export default eventHandler(async (event) => {
  const { req, res } = event.node;
  const interaction = await oidc.interactionDetails(req, res);

  return sendRedirect(event, `${event.path}/${interaction.prompt.name}`);
});
