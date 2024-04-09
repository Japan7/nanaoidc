import assert from "node:assert/strict";
import type { InteractionResults } from "oidc-provider";

export default eventHandler(async (event) => {
  const query = getQuery(event);
  const { code } = query;
  assert(typeof code === "string");

  const resp = await exchangeCode(code);
  const { user, member } = await fetchUserinfo(resp.access_token);
  userStore.set(user.id, { user, member });

  const result: InteractionResults = {
    login: { accountId: user.id },
  };
  const { req, res } = event.node;
  const redirectTo = await provider.interactionResult(req, res, result);
  return sendRedirect(event, redirectTo);
});
