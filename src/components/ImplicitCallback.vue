<script>
export default {
  name: "ImplicitCallback",
  async beforeMount() {
    await this.$auth._handleAuthentication();
    await this.$nextTick();
    if (this.$auth.isAuthenticated()) {
      await this.$auth._setUser();
      await this.$auth.vuexActions.afterLogIn({ router: this.$router });
    }
  },
  render(h) {
    return h();
  }
};
</script>
