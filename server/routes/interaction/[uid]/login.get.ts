import assert from "node:assert/strict";

export default eventHandler(async (event) => {
  const { req, res } = event.node;
  const interaction = await oidc.interactionDetails(req, res);
  assert.equal(interaction.prompt.name, "login");

  const session = await useTypedSession(event);
  await session.update({ redirect: `${event.path}/../callback` });

  return sendRedirect(event, "/api/discord/login");
});
