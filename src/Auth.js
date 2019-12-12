import OktaSignIn from "@okta/okta-signin-widget/dist/js/okta-sign-in.min";
import initConfig, { initOptions } from "./utils/initConfig";

function install(Vue, options) {
  options = initOptions(options);
  console.log("options %o", options);
  const authConfig = initConfig(options.oktaSignIn);
  console.log("authConfig %o", authConfig);
  const oktaSignIn = new OktaSignIn(authConfig);
  const { authClient } = oktaSignIn;
  const { store } = options;

  console.log("authClient %o", authClient);

  // Triggered when the token has expired
  authClient.tokenManager.on("expired", async (key, expiredToken) => {
    console.warn("Token with key", key, " has expired.");
    console.log(expiredToken);
    switch (key) {
      case "idToken":
        await options.handleIdTokenExpired(
          authClient.tokenManager,
          Vue.prototype.$auth
        );
        break;

      case "accessToken":
      default:
        await options.handleAccessTokenExpired(
          authClient.tokenManager,
          Vue.prototype.$auth
        );
        break;
    }
  });

  authClient.tokenManager.on("renewed", async (key, newToken, oldToken) => {
    console.log("Token with key", key, "has been renewed");
    console.info("Old token:", oldToken);
    console.info("New token:", newToken);
    await Vue.prototype.$auth.setUser();
  });

  // Triggered when an OAuthError is returned via the API
  authClient.tokenManager.on("error", err => {
    console.warn("TokenManager error:", err);
    // err.name
    // err.message
    // err.errorCode
    // err.errorSummary

    if (err.errorCode === "login_required") {
      // Return to unauthenticated state
      Vue.prototype.$auth.logout();
    }
  });

  // eslint-disable-next-line no-param-reassign
  Vue.prototype.$auth = {
    /**
     * Logout
     * dispatchs logout action.
     */
    async logout() {
      if (await this.isAuthenticated()) {
        await authClient.signOut();
      }
      authClient.tokenManager.clear();
      // store.dispatch(options.stateNamespace + options.stateActions.logout);
    },
    async accessTokenExpired() {
      await store.dispatch(
        options.stateNamespace + options.stateActions.tokenExpired
      );
    },
    /**
     * Run only once after login
     */
    async postLogIn() {
      store.dispatch(options.stateNamespace + options.stateActions.postLogIn);
    },
    /**
     * setUser
     * dispatchs setUser action
     */
    async setUser() {
      const currentUser = await this.getUser();
      if (currentUser !== undefined || currentUser !== null) {
        currentUser.token = await this.getAccessToken();
        store.dispatch(
          options.stateNamespace + options.stateActions.setUser,
          currentUser
        );
        return true;
      }
      return false;
    },
    renderSignInWidget(el) {
      oktaSignIn.renderEl({ el });
    },
    async loginRedirect(fromUri) {
      if (fromUri) {
        localStorage.setItem("referrerPath", fromUri);
      }
      return "/"; //authClient.token.getWithRedirect(authConfig);
    },
    async isAuthenticated() {
      try {
        return !!(await this.getAccessToken()) || !!(await this.getIdToken());
      } catch (error) {
        console.error("isAuthenticated Error");
        console.error(error);
      }
      return false;
    },
    async handleAuthentication() {
      try {
        const tokens = await authClient.token.parseFromUrl();
        tokens.forEach(token => {
          if (token.accessToken) {
            authClient.tokenManager.add("accessToken", token);
          }
          if (token.idToken) {
            authClient.tokenManager.add("idToken", token);
          }
        });
      } catch (error) {
        console.warn("error %o", error);
      }
    },
    getFromUri() {
      const path =
        localStorage.getItem("referrerPath") || options.afterLogInUrl || "/";
      localStorage.removeItem("referrerPath");
      console.info("getFromUri - path %o", path);
      return path;
    },
    async getIdToken() {
      try {
        const idToken = await authClient.tokenManager.get("idToken");
        return idToken.idToken;
      } catch (err) {
        // The user no longer has an existing SSO session in the browser.
        // (OIDC error `login_required`)
        // Ask the user to authenticate again.
        return undefined;
      }
    },
    async getAccessToken() {
      try {
        const accessToken = await authClient.tokenManager.get("accessToken");
        return accessToken.accessToken;
      } catch (err) {
        // The user no longer has an existing SSO session in the browser.
        // (OIDC error `login_required`)
        // Ask the user to authenticate again.
        return undefined;
      }
    },
    async getUser() {
      const accessToken = await authClient.tokenManager.get("accessToken");
      const idToken = await authClient.tokenManager.get("idToken");
      if (accessToken && idToken) {
        const userinfo = await authClient.token.getUserInfo(accessToken);
        if (userinfo.sub === idToken.claims.sub) {
          // Only return the userinfo response if subjects match to
          // mitigate token substitution attacks
          return userinfo;
        }
      }
      return idToken ? idToken.claims : undefined;
    },
    authRedirectGuard() {
      return async (to, from, next) => {
        if (
          to.matched.some(record => record.meta.requiresAuth) &&
          !(await this.isAuthenticated())
        ) {
          console.info("authRedirectGuard is not Auth - path %o", to.path);
          this.loginRedirect(to.path);
        } else {
          next();
        }
      };
    }
  };
}

export default install;
