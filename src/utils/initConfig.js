import {
  assertIssuer,
  assertClientId,
  assertRedirectUri,
  buildConfigObject
} from "@okta/configuration-validation";

// eslint-disable-next-line
async function handleIdTokenExpired(tokenManager, $auth) {
  if (!(await $auth.isAuthenticated())) {
    $auth.logout();
  }
}

async function handleAccessTokenExpired(tokenManager, $auth) {
  if (!(await $auth.isAuthenticated())) {
    await $auth.logout();
    await $auth.accessTokenExpired();
  }
  // if (await $auth.isAuthenticated()) {
  //   await tokenManager.renew("accessToken");
  // } else {
  //   $auth.logout();
  // }
}

export default function initConfig(options) {
  // Normalize config object
  const auth = buildConfigObject(options.authParams);

  // Assert configuration
  assertIssuer(auth.issuer, auth.testing);
  assertClientId(options.clientId);
  assertRedirectUri(options.redirectUri || options.redirect_uri);

  // Ensure "openid" exists in the scopes
  auth.scopes = auth.scopes || ["openid", "profile", "email"];
  if (auth.scopes.indexOf("openid") < 0) {
    auth.scopes.unshift("openid");
  }
  delete auth.clientId;
  // Set default responseType if not specified
  auth.responseType = auth.responseType || ["id_token", "token"];
  // eslint-disable-next-line
  options.authParams = auth;
  // options.clientId = auth.clientId;
  options.baseUrl = auth.issuer.split("/oauth2")[0];

  return options;
}

function setVuexAction(store, stateNamespace, stateAction) {
  if (store && store.constructor.name === "Store") {
    if (stateAction) {
      return data => store.dispatch(stateNamespace + stateAction, data);
    }
  }
  return () => {};
}

export function makeVuexActions(options) {
  const actions = {
    logout: setVuexAction(
      options.store,
      options.stateNamespace,
      options.stateActions.logout
    ),
    setUser: setVuexAction(
      options.store,
      options.stateNamespace,
      options.stateActions.setUser
    ),
    tokenExpired: setVuexAction(
      options.store,
      options.stateNamespace,
      options.stateActions.tokenExpired
    ),
    postLogIn: setVuexAction(
      options.store,
      options.stateNamespace,
      options.stateActions.postLogIn
    )
  };

  if (!options.store || !(options.store.constructor.name === "Store")) {
    console.warn("No Store Found no actions will be taken");
  }

  return actions;
}

export function initOptions(options) {
  options.handleAccessTokenExpired =
    options.handleAccessTokenExpired || handleAccessTokenExpired;

  options.handleIdTokenExpired =
    options.handleIdTokenExpired || handleIdTokenExpired;

  options.stateNamespace = options.stateNamespace || "auth/";
  // options.stateActions = options.stateActions || {
  //   logout: "logOut",
  //   setUser: "setUser",
  //   tokenExpired: "tokenExpired",
  //   postLogIn: "postLogIn"
  // };

  options.routing.afterLogInUrl = options.routing.afterLogInUrl || "/";
  options.routing.logInUrl = options.routing.logInUrl || "/logIn";
  return options;
}
