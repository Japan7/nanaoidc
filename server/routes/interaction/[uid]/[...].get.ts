export default eventHandler(async (event) => {
  const { req, res } = event.node;
  const interaction = await oidc.interactionDetails(req, res);

  throw new Error("Unknown interaction prompt: " + interaction.prompt.name);
});
