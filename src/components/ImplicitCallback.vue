<script>
export default {
  name: 'ImplicitCallback',
  async beforeMount() {
    await this.$auth.handleAuthentication();
    if (this.$auth.isAuthenticated()) {
      await this.$auth.setUser();
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
