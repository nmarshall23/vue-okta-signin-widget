<script>
export default {
  name: 'ImplicitCallback',
  async beforeMount() {
    await this.$auth.handleAuthentication();
    await this.$nextTick();
    if (this.$auth.isAuthenticated()) {
      await this.$auth.setUser();
      await this.$auth.postLogIn();
    }
    this.$router.replace({
      path: this.$auth.getFromUri()
    });
  },
  render(h) {
    return h();
  }
};
</script>
