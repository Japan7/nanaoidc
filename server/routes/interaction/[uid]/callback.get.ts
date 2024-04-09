import type { InteractionResults } from "oidc-provider";

export default eventHandler(async (event) => {
  const { req, res } = event.node;
  const result: InteractionResults = {
    login: {
      accountId: "abc",
    },
  };
  const redirectTo = await oidc.interactionResult(req, res, result);
  return sendRedirect(event, redirectTo);
});
