import Provider, { type Configuration } from "oidc-provider";

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
