import assert from "node:assert/strict";
import type Provider from "oidc-provider";

/**
 * Implicit consent
 */
export default eventHandler(async (event) => {
  const { req, res } = event.node;
  const interaction = await oidc.interactionDetails(req, res);
  assert.equal(interaction.prompt.name, "consent");

  const {
    prompt: { name, details },
    params,
    session: { accountId },
  } = interaction;

  let grantId = details?.grantId as string | undefined;
  let grant: InstanceType<Provider["Grant"]>;

  if (grantId) {
    // we'll be modifying existing grant in existing session
    grant = await oidc.Grant.find(grantId);
  } else {
    // we're establishing a new grant
    grant = new oidc.Grant({
      accountId,
      clientId: params.client_id as string,
    });
  }

  if (details.missingOIDCScope) {
    grant.addOIDCScope((details.missingOIDCScope as string[]).join(" "));
  }
  if (details.missingOIDCClaims) {
    grant.addOIDCClaims(details.missingOIDCClaims as string[]);
  }
  if (details.missingResourceScopes) {
    for (const [indicator, scopes] of Object.entries(
      details.missingResourceScopes
    )) {
      grant.addResourceScope(indicator, scopes.join(" "));
    }
  }

  grantId = await grant.save();

  const consent: { grantId?: string } = {};
  if (!interaction.grantId) {
    // we don't have to pass grantId to consent, we're just modifying existing one
    consent.grantId = grantId;
  }

  const result = { consent };
  const redirectTo = await oidc.interactionResult(req, res, result);

  return sendRedirect(event, redirectTo);
});
