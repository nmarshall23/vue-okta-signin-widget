# vue-okta-signin-widget

A Vueified Wrapper around okta-signin-widget.

This 

```js
Vue.use(Auth, {
  stateNamespace: 'auth/',
  stateActions: {
    logout: 'logout',
    setUser: 'setUser',
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
```
yarn install
```

### Compiles and hot-reloads for development
```
yarn serve
```

### Compiles and minifies for production
```
yarn build
```

### Lints and fixes files
```
yarn lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
