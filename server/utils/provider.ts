import Provider, { type Configuration } from "oidc-provider";

const config: Configuration = {
  adapter: RedisAdapter,
  clients: userConfig.clients,
  findAccount: Account.findAccount,
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
  cookies: {
    keys: userConfig.oidc.cookies.keys,
  },
  expiresWithSession: () => false,
  features: {
    devInteractions: { enabled: false },
  },
  jwks: userConfig.oidc.jwks,
  pkce: { required: () => false },
  ttl: {
    AccessToken: (ctx, token, client) => {
      return token.resourceServer?.accessTokenTTL || 60 * 60; // 1 hour in seconds
    },
    AuthorizationCode: 60 /* 1 minute in seconds */,
    BackchannelAuthenticationRequest: (ctx, request, client) => {
      if (ctx?.oidc && ctx.oidc.params.requested_expiry) {
        return Math.min(10 * 60, +ctx.oidc.params.requested_expiry); // 10 minutes in seconds or requested_expiry, whichever is shorter
      }
      return 10 * 60; // 10 minutes in seconds
    },
    ClientCredentials: (ctx, token, client) => {
      return token.resourceServer?.accessTokenTTL || 10 * 60; // 10 minutes in seconds
    },
    DeviceCode: 600 /* 10 minutes in seconds */,
    Grant: 24 * 60 * 60 /* 1 day in seconds */,
    IdToken: 3600 /* 1 hour in seconds */,
    Interaction: 3600 /* 1 hour in seconds */,
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
      return 24 * 60 * 60; // 1 day in seconds
    },
    Session: 24 * 60 * 60 /* 1 day in seconds */,
  },
};

export const provider = new Provider(userConfig.publicUrl, config);
provider.proxy = true;
