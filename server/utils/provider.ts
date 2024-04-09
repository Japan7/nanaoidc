import Provider from "oidc-provider";

const configuration = {
  // ... see the available options in Configuration options section
  clients: [
    {
      client_id: "foo",
      client_secret: "bar",
      redirect_uris: ["http://lvh.me:8080/cb"],
      // + other client properties
    },
  ],
  // ...
};

export const oidc = new Provider(process.env.PUBLIC_URL, configuration);
