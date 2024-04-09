import Provider, { type Configuration } from "oidc-provider";

const config: Configuration = {
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

export const provider = new Provider(userConfig.publicUrl, config);
provider.proxy = true;
