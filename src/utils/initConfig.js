import {
  assertIssuer,
  assertClientId,
  assertRedirectUri,
  buildConfigObject
} from "@okta/configuration-validation";

async function handleTokenExpired($auth) {
  // console.warn("Token with key", key, " has expired.");
  if (!(await $auth.isAuthenticated())) {
    $auth.logOut();
  }
}

function handleAuthError({ error }) {
  console.error("isAuthenticated Error");
  console.error(error);
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
    if (typeof stateAction === "function") {
      return stateAction;
    } else if (typeof stateAction === "string") {
      return data => store.dispatch(`${stateNamespace}/${stateAction}`, data);
    }
  }
  return () => {};
}

export function makeVuexActions(options) {
  const defaultActions = {
    logOut: false,
    /**
     * Run everytime user is updated.
     */
    setUser: false,
    /**
     * Run only once after login
     */
    afterLogIn: router => router.push("/"),
    setAccessToken: false,
    setIdToken: false,
    onAuthError: handleAuthError,
    authRedirect: ({ next }) => next("/"),
    onAccessTokenExpired: ({ $auth }) => handleTokenExpired($auth),
    onIdTokenExpired: ({ $auth }) => handleTokenExpired($auth)
  };
  const stateActions = Object.assign({}, defaultActions, options.stateActions);

  const vuexActions = {};
  for (let i in stateActions) {
    vuexActions[i] = setVuexAction(
      options.store,
      options.stateNamespace,
      stateActions[i]
    );
  }

  if (!options.store || !(options.store.constructor.name === "Store")) {
    console.warn("No Vuex Store Found. No actions will be taken");
  }

  return vuexActions;
}

export function initOptions(options) {
  options.stateNamespace = options.stateNamespace || "auth";

  return options;
}
