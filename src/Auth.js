import OktaSignIn from "@okta/okta-signin-widget/dist/js/okta-sign-in.min";
import initConfig, { initOptions, makeVuexActions } from "./utils/initConfig";

function install(Vue, options) {
  options = initOptions(options);
  console.log("options %o", options);
  const authConfig = initConfig(options.oktaSignIn);
  // console.log("authConfig %o", authConfig);
  const oktaSignIn = new OktaSignIn(authConfig);
  const { authClient } = oktaSignIn;

  const vuexActions = makeVuexActions(options);

  // console.log("authClient %o vuexActions: %o", authClient, vuexActions);
  console.log("vuexActions: %o", vuexActions);
  // console.log("authClient %o", authClient);

  // Triggered when the token has expired
  // eslint-disable-next-line no-unused-vars
  authClient.tokenManager.on("expired", (key, expiredToken) => {
    // console.warn("Token with key", key, " has expired.");
    // console.log(expiredToken);
    const params = {
      // tokenManager: authClient.tokenManager,
      $auth: Vue.prototype.$auth,
      expiredToken,
    };

    switch (key) {
      case "idToken":
        vuexActions.onIdTokenExpired(params);
        break;

      case "accessToken":
      default:
        vuexActions.onAccessTokenExpired(params);
        break;
    }
  });
  // eslint-disable-next-line no-unused-vars
  authClient.tokenManager.on("renewed", async (key, newToken, oldToken) => {
    // console.log("Token with key", key, "has been renewed");
    // console.info("Old token:", oldToken);
    // console.info("New token:", newToken);
    switch (key) {
      case "idToken":
        vuexActions.setIdToken({ token: newToken.idToken });
        break;

      case "accessToken":
      default:
        vuexActions.setAccessToken({ token: newToken.accessToken });
        break;
    }
  });

  // Triggered when an OAuthError is returned via the API
  authClient.tokenManager.on("error", (err) => {
    console.warn("TokenManager error:", err);
    // err.name
    // err.message
    // err.errorCode
    // err.errorSummary
    if (err.errorCode === "login_required") {
      // Return to unauthenticated state
      console.debug("TokenManager logout?");
      vuexActions.loginRequired();
      // Vue.prototype.$auth.logOut();
    } else {
      vuexActions.onTokenError({ err });
    }
  });

  // eslint-disable-next-line no-param-reassign
  Vue.prototype.$auth = {
    /******************* Internal API *********/
    /**
     * The vuexAction are internal API
     */
    vuexActions,
    /**
     * setUser
     * Gets user from Okta
     * Sets accessToken to `currentUser.token`
     * dispatchs setUser action with currentUser
     */
    async _setUser() {
      const currentUser = await this.getUser();
      if (currentUser !== undefined || currentUser !== null) {
        // currentUser.token = await this.getAccessToken();
        await vuexActions.setUser({ user: currentUser });
        return true;
      }
      return false;
    },
    async _handleAuthentication() {
      try {
        const { tokens } = await authClient.token.parseFromUrl();
        // console.log("_handleAuthentication - tokens", tokens);
        if (tokens.accessToken) {
          authClient.tokenManager.add("accessToken", tokens.accessToken);
          vuexActions.setAccessToken({ token: tokens.accessToken.value });
        }
        if (tokens.idToken) {
          authClient.tokenManager.add("idToken", tokens.idToken);
          vuexActions.setIdToken({ token: tokens.idToken.value });
        }
      } catch (error) {
        console.warn("Authentication error %o", error);
      }
    },
    /******** Public API  *********/
    /**
     * Clear Token tokenManager
     * Dispatch logOut Action
     */
    async logOut() {
      if (await this.isAuthenticated()) {
        try {
          await authClient.signOut();
        } catch (err) {
          switch (err.errorCode) {
            case "E0000007":
              // means that the session is expired
              // that's normal
              // eat this error.
              break;

            default:
              throw err;
          }
        }
      }
      authClient.tokenManager.clear();
      await vuexActions.logOut();
    },

    renderSignInWidget(el) {
      oktaSignIn.renderEl({ el });
    },
    removeWidget() {
      oktaSignIn.remove();
    },
    async isAuthenticated() {
      try {
        return !!(await this.getAccessToken()) || !!(await this.getIdToken());
      } catch (error) {
        // console.error("isAuthenticated Error");
        // console.error(error);
        await vuexActions.onAuthError({ error });
      }
      return false;
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
          to.matched.some((record) => record.meta.requiresAuth) &&
          !(await this.isAuthenticated())
        ) {
          // console.info("authRedirectGuard is not Auth - path %o", to.path);
          await vuexActions.authRedirect({ to, from, next });
        } else {
          next();
        }
      };
    },
  };
}

export default install;
