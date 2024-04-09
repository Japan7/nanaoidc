export default eventHandler(async (event) => {
  const { req, res } = event.node;
  const interaction = await provider.interactionDetails(req, res);

  throw new Error("Unknown interaction prompt: " + interaction.prompt.name);
});
