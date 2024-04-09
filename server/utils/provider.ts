import Provider, {
  type ClientMetadata,
  type Configuration,
} from "oidc-provider";

const clients: ClientMetadata[] = [
  {
    client_id: "client",
    client_secret: "secret",
    redirect_uris: ["https://openidconnect.net/callback"],
  },
];

const config: Configuration = {
  clients,
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
    ],
    groups: ["groups"],
  },
  pkce: {
    required: () => false, // FIXME:
  },
  features: {
    devInteractions: { enabled: process.env.NODE_ENV !== "production" },
  },
};

export const oidc = new Provider(process.env.PUBLIC_URL, config);
oidc.proxy = true;
