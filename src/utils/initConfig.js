import {
  assertIssuer,
  assertClientId,
  assertRedirectUri,
  buildConfigObject
} from "@okta/configuration-validation";


export default function initConfig(options) {
  // Normalize config object
  const auth = buildConfigObject(options.authParams);

  // Assert configuration
  assertIssuer(auth.issuer, auth.testing);
  assertClientId(auth.clientId);
  assertRedirectUri(options.redirectUri);

  // Ensure "openid" exists in the scopes
  auth.scopes = auth.scopes || ["openid", "profile", "email"];
  if (auth.scopes.indexOf("openid") < 0) {
    auth.scopes.unshift("openid");
  }

  // Set default responseType if not specified
  auth.responseType = auth.responseType || ["id_token", "token"];
  // eslint-disable-next-line
  options.authParams = auth;
  options.clientId = auth.clientId;
  options.baseUrl = auth.issuer.split("/oauth2")[0];

  return options;
}
