import "@okta/okta-signin-widget/dist/css/okta-sign-in.min.css";

import Auth from "./Auth";
import ImplicitCallback from "./components/ImplicitCallback.vue";

function install(Vue, options) {
  Vue.component("ImplicitCallback", ImplicitCallback);
  Auth(Vue, options);
}

export default { install, ImplicitCallback };
