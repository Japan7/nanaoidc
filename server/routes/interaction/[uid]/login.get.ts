import assert from "node:assert/strict";
import { provider } from "~/utils/provider";

export default eventHandler(async (event) => {
  const { req, res } = event.node;
  const interaction = await provider.interactionDetails(req, res);
  assert.equal(interaction.prompt.name, "login");

  const params = new URLSearchParams({ redirect: `${event.path}/../callback` });
  return sendRedirect(event, `/discord/auth?${params}`);
});
