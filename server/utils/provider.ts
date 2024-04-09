import Provider, {
  type ClientMetadata,
  type Configuration,
  type FindAccount,
} from "oidc-provider";

const clients: ClientMetadata[] = [
  {
    client_id: "client",
    client_secret: "secret",
    redirect_uris: ["https://openidconnect.net/callback"],
  },
];

const findAccount: FindAccount = async (ctx, sub, token) => {
  return {
    accountId: sub,
    async claims(use, scope, claims, rejected) {
      return {
        sub,
      };
    },
  };
};

const config: Configuration = {
  clients,
  findAccount,
  pkce: { required: () => false }, // FIXME:
  features: {
    devInteractions: { enabled: process.env.NODE_ENV !== "production" },
  },
};

export const oidc = new Provider(process.env.PUBLIC_URL, config);
oidc.proxy = true;
