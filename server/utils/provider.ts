import { URL } from "node:url";
import Provider, { errors, type Configuration } from "oidc-provider";
import psl from "psl";
import wildcard from "wildcard";

const config: Configuration = {
  adapter: RedisAdapter,

  clients: userConfig.clients,

  findAccount: Account.findAccount,

  jwks: userConfig.oidc.jwks,

  features: {
    devInteractions: { enabled: false },
  },

  claims: {
    address: ["address"],
    email: ["email", "email_verified"],
    phone: ["phone_number", "phone_number_verified"],
    profile: [
      "birthdate",
      "family_name",
      "gender",
      "given_name",
      "locale",
      "middle_name",
      "name",
      "nickname",
      "picture",
      "preferred_username",
      "profile",
      "updated_at",
      "website",
      "zoneinfo",
      // additional claims
      "discord_id",
    ],
    groups: ["groups"],
  },

  clientBasedCORS: (ctx, origin, client) =>
    client.redirectUris.some((uri) => uri.startsWith(origin)),

  cookies: {
    keys: userConfig.oidc.cookies.keys,
  },

  expiresWithSession: () => false,

  extraClientMetadata: {
    // https://github.com/panva/node-oidc-provider/blob/87cd3c5c335cb30074612b405bd581c6bc76a98d/recipes/redirect_uri_wildcards.md
    properties: ["redirect_uris"],
    validator: (ctx, key, value: string[], metadata) => {
      if (key === "redirect_uris") {
        for (const redirectUri of value) {
          if (redirectUri.includes("*")) {
            const { hostname, href } = new URL(redirectUri);
            if (href.split("*").length !== 2) {
              throw new errors.InvalidClientMetadata(
                "redirect_uris with a wildcard may only contain a single one"
              );
            }
            if (!hostname.includes("*")) {
              throw new errors.InvalidClientMetadata(
                "redirect_uris may only have a wildcard in the hostname"
              );
            }
            const test = hostname.replace("*", "test");
            // checks that the wildcard is for a full subdomain e.g. *.panva.cz, not *suffix.panva.cz
            if (!wildcard(hostname, test)) {
              throw new errors.InvalidClientMetadata(
                "redirect_uris with a wildcard must only match the whole subdomain"
              );
            }
            if (!psl.get(hostname.split("*.")[1])) {
              throw new errors.InvalidClientMetadata(
                "redirect_uris with a wildcard must not match an eTLD+1 of a known public suffix domain"
              );
            }
          }
        }
      }
    },
  },

  pkce: {
    required: () => false,
  },

  ttl: {
    // max 1 hour in seconds
    AccessToken: (ctx, token, client) =>
      token.resourceServer?.accessTokenTTL || 60 * 60,
    // 1 minute in seconds
    AuthorizationCode: 60,
    // max 10 minutes in seconds
    BackchannelAuthenticationRequest: (ctx, request, client) => {
      if (ctx?.oidc && ctx.oidc.params.requested_expiry) {
        // 10 minutes in seconds or requested_expiry, whichever is shorter
        return Math.min(10 * 60, +ctx.oidc.params.requested_expiry);
      }
      return 10 * 60;
    },
    // max 10 minutes in seconds
    ClientCredentials: (ctx, token, client) =>
      token.resourceServer?.accessTokenTTL || 10 * 60,
    // 10 minutes in seconds
    DeviceCode: 10 * 60,
    // 1 day in seconds
    Grant: 24 * 60 * 60,
    // 1 hour in seconds
    IdToken: 60 * 60,
    // 1 hour in seconds
    Interaction: 60 * 60,
    // max 1 day in seconds
    RefreshToken: (ctx, token, client) => {
      if (
        ctx &&
        ctx.oidc.entities.RotatedRefreshToken &&
        client.applicationType === "web" &&
        client.clientAuthMethod === "none" &&
        !token.isSenderConstrained()
      ) {
        // Non-Sender Constrained SPA RefreshTokens do not have infinite expiration through rotation
        return ctx.oidc.entities.RotatedRefreshToken.remainingTTL;
      }
      // 1 day in seconds
      return 24 * 60 * 60;
    },
    // 1 day in seconds
    Session: 24 * 60 * 60,
  },
};

export const provider = new Provider(userConfig.publicUrl, config);
provider.proxy = true;

// https://github.com/panva/node-oidc-provider/blob/87cd3c5c335cb30074612b405bd581c6bc76a98d/recipes/redirect_uri_wildcards.md
// redirectUriAllowed on a client prototype checks whether a redirect_uri is allowed or not
const { redirectUriAllowed } = provider.Client.prototype;
const hasWildcardHost = (redirectUri: string) => {
  const { hostname } = new URL(redirectUri);
  return hostname.includes("*");
};
const wildcardMatches = (redirectUri: string, wildcardUri: string) =>
  !!wildcard(wildcardUri, redirectUri);
provider.Client.prototype.redirectUriAllowed = function (redirectUri) {
  if (!redirectUri.includes("*")) {
    return redirectUriAllowed.call(this, redirectUri);
  }
  const wildcardUris = this.redirectUris.filter(hasWildcardHost);
  return wildcardUris.some(wildcardMatches.bind(undefined, redirectUri));
};
