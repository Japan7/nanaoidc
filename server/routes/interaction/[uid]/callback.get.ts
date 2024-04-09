import assert from "node:assert/strict";
import type { InteractionResults } from "oidc-provider";

export default eventHandler(async (event) => {
  const query = getQuery(event);
  const { code } = query;
  assert(typeof code === "string");

  const resp = await exchangeCode(code);
  const infos = await fetchUserinfo(resp.access_token);
  await Account.save(infos);

  const result: InteractionResults = {
    login: { accountId: infos.user.id },
  };
  const { req, res } = event.node;
  const redirectTo = await provider.interactionResult(req, res, result);
  return sendRedirect(event, redirectTo);
});
