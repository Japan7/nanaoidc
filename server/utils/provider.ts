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
    // https://github.com/tsedio/tsed/tree/2a61da42a005d335ea85ba917d5e631cb3cd43d5/packages/security/oidc-provider-plugin-wildcard-redirect-uri
    properties: ["redirect_uris", "post_logout_redirect_uris"],
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
            if (!psl.get(hostname.split("*.")[1])) {
              throw new errors.InvalidClientMetadata(
                "redirect_uris with a wildcard must not match an eTLD+1 of a known public suffix domain"
              );
            }
          }
        }
      } else if (key === "post_logout_redirect_uris") {
        for (const postLogoutRedirectUri of value) {
          if (postLogoutRedirectUri.includes("*")) {
            const { hostname, href } = new URL(postLogoutRedirectUri);

            if (href.split("*").length !== 2) {
              throw new errors.InvalidClientMetadata(
                "post_logout_redirect_uris with a wildcard may only contain a single one"
              );
            }

            if (!hostname.includes("*")) {
              throw new errors.InvalidClientMetadata(
                "post_logout_redirect_uris may only have a wildcard in the hostname"
              );
            }

            if (!psl.get(hostname.split("*.")[1])) {
              throw new errors.InvalidClientMetadata(
                "post_logout_redirect_uris with a wildcard must not match an eTLD+1 of a known public suffix domain"
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

const hasWildcardHost = (redirectUri: string) => {
  const { hostname } = new URL(redirectUri);
  return hostname.includes("*");
};

const wildcardMatches = (redirectUri: string, wildcardUri: string) =>
  !!wildcard(wildcardUri, redirectUri);

export function wildcardRedirectUriAllowed(
  originalRedirectUriAllowed: any,
  redirectUriOrPostLogoutRedirectUri: "redirectUris" | "postLogoutRedirectUris"
) {
  return function (redirectUri: string) {
    if (this[redirectUriOrPostLogoutRedirectUri].some(hasWildcardHost)) {
      const wildcardUris =
        this[redirectUriOrPostLogoutRedirectUri].filter(hasWildcardHost);
      return (
        wildcardUris.some(wildcardMatches.bind(undefined, redirectUri)) ||
        originalRedirectUriAllowed.call(this, redirectUri)
      );
    }
    return originalRedirectUriAllowed.call(this, redirectUri);
  };
}

const { redirectUriAllowed, postLogoutRedirectUriAllowed } =
  provider.Client.prototype;
provider.Client.prototype.redirectUriAllowed = wildcardRedirectUriAllowed(
  redirectUriAllowed,
  "redirectUris"
);
provider.Client.prototype.postLogoutRedirectUriAllowed =
  wildcardRedirectUriAllowed(
    postLogoutRedirectUriAllowed,
    "postLogoutRedirectUris"
  );
