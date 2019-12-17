# vue-okta-signin-widget

Vue plugin for okta-signin-widget, and Auth Handling.

This library only handles OpenID Connect redirect flow.

## Features

Dispaches Vuex actions on Auth events.

On a successful longin. ImplicitCallback will dispatch:

1. `setAccessToken`, `setIdToken` both have a single param the `{ token }`.
2. `setUser` param is user's Okta App Object `{ user }`
3. `afterLogIn` param is the \$router. `{ router }`. The default action will push to "/"

When a token is renewed. `setAccessToken`, or `setIdToken` is dispatched with new token. `{ token }`

When a token can no longer be renewed, and expires `logOut` is dispatched.

Or when `$auth.logOut()` is called.

Example Config:

```js
Vue.use(Auth, {
  defaultCallbackParams: {},
  store, // copy of your Vuex.Store Object
  stateNamespace: "auth",
  // stateActions can be either a function or a string.
  // if they are a string it's assumed that the string value is a valid action.
  // for example `${stateNamespace}/${logOut}` should be the logOut action.
  stateActions: {
    logOut: "logout", // No params
    setUser: "setUser", // User Object in { user }
    setAccessToken: "setAccessToken", // This is your Auth Bearer Token.
    setIdToken: "setIdToken", // Id token
    afterLogIn: "afterLogIn", // router
    authRedirect: "authRedirect" // Dispatched in the authRedirectGuard. When trying to go to a route with requiresAuth, but is not authenticated
    // Params are { to, from, next } you must invoke next().
    // If unset the default is to routes to '/'.
  },
  // this is your standard okta-signin-widget configuration
  // see https://github.com/okta/okta-signin-widget#configuration for options
  oktaSignIn: {
    redirectUri: window.location.origin + "/implicit/callback",
    authParams: {
      clientId: process.env.VUE_APP_OKTA_CLIENT_ID,
      responseType: ["id_token", "token"],
      display: "page",
      issuer: ISSUER
    },
    i18n: {
      en: {
        "primaryauth.title": "Sign In"
      }
    },
    features: {
      rememberMe: false
    },
    tokenManager: {
      expireEarlySeconds: 120,
      redirectUri: "/login"
      // autoRenew: true
    }
  }
});
```

In your login component add:

```js
mounted() {
  this.$auth.renderSignInWidget('#osw-container')
},
```

Lastly add a router guard.

```js
router.beforeEach(Vue.prototype.$auth.authRedirectGuard());
```

## Project setup

```cli
yarn install
```

### Compiles and hot-reloads for development

```cli
yarn serve
```

### Compiles and minifies for production

```cli
yarn build
```

### Lints and fixes files

```cli
yarn lint
```
