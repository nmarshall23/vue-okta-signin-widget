# vue-okta-signin-widget

A Vueified Wrapper around okta-signin-widget.

## Features



Example Config:

```js
Vue.use(Auth, {
  routing: {
    afterLogInUrl: '/dashboard',
    logInUrl: '/logIn',
  },
  store, // copy of your Vuex.Store Object
  stateNamespace: 'auth/',
  stateActions: {
    logout: 'logout',
    setUser: 'setUser',
    tokenExpired: "tokenExpired",
    postLogIn: "postLogIn"
  },
  oktaSignIn: {
    redirectUri: window.location.origin + '/implicit/callback',
    authParams: {
      clientId: process.env.VUE_APP_OKTA_CLIENT_ID,
      responseType: ['id_token', 'token'],
      display: 'page',
      issuer: ISSUER,
    },
    i18n: {
      en: {
        'primaryauth.title': 'Sign In',
      },
    },
    features: {
      rememberMe: false,
    },
    tokenManager: {
      expireEarlySeconds: 120,
      redirectUri: '/login'
      // autoRenew: true
    }
  },
});
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
