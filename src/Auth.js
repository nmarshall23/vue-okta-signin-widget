import OktaSignIn from "@okta/okta-signin-widget/dist/js/okta-sign-in-no-jquery";
import initConfig from "./utils/initConfig";

function install(Vue, options) {
  console.log("options %o", options);
  const authConfig = initConfig(options.oktaSignIn);
  console.log("authConfig %o", authConfig);
  const oktaSignIn = new OktaSignIn(authConfig);
  const { authClient } = oktaSignIn;

  // Triggered when the token has expired
  authClient.tokenManager.on("expired", (key, expiredToken) => {
    console.log("Token with key", key, " has expired:");
    console.log(expiredToken);
    // Vue.prototype.$auth.logout();
    // Vue.$root.$emit("tokenExpired");
    Vue.prototype.$auth.logout();
  });

  authClient.tokenManager.on("renewed", (key, newToken, oldToken) => {
    console.log("Token with key", key, "has been renewed");
    console.log("Old token:", oldToken);
    console.log("New token:", newToken);
    // Vue.$root.$emit("tokenRenewed");
    Vue.prototype.$auth.setUser();
  });

  // Triggered when an OAuthError is returned via the API
  authClient.tokenManager.on("error", err => {
    console.log("TokenManager error:", err);
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
    async loginRedirect(fromUri) {
      if (fromUri) {
        localStorage.setItem("referrerPath", fromUri);
      }
      return authClient.token.getWithRedirect(authConfig);
    },
    async setUser() {
      const currentUser = await this.getUser();
      currentUser.token = await this.getIdToken();
      // Vue.$root.$emit("initUser", currentUser);
      Vue.$store.commit(options.stateNamespace + options.actions.setUser);
    },
    renderSignInWidget(el) {
      oktaSignIn.renderEl({ el });
    },
    async logout() {
      authClient.tokenManager.clear();
      await authClient.signOut();
      Vue.$store.commit(options.stateNamespace + options.actions.logout);
    },
    async isAuthenticated() {
      const isSignedIn =
        !!(await this.getAccessToken()) || !!(await this.getIdToken());
      return isSignedIn;
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
      const path = localStorage.getItem("referrerPath") || "/";
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
          this.loginRedirect(to.path);
        } else {
          next();
        }
      };
    }
  };
}

export default install;
