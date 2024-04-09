export default eventHandler(async (event) => {
  const { req, res } = event.node;
  const interaction = await provider.interactionDetails(req, res);
  return sendRedirect(event, `${event.path}/${interaction.prompt.name}`);
});
