<template>
  <div v-bem>
    <router-view />
    <s-navigation :routes="routes" nav-position="bottom-right" />
  </div>
</template>

<script>
  import sNavigation from '@/styleguide/components/s-navigation';
  import styleguideRoutes from '@/setup/styleguide.routes';

  export default {
    name: 's-layout',
    // status: 1,

    components: {
      sNavigation,
    },
    // mixins: [],

    // props: {},
    // data() {
    //   return {};
    // },

    computed: {
      routes() {
        return styleguideRoutes;
      }
    },
    // watch: {},

    // beforeCreate() {},
    // created() {},
    // beforeMount() {},
    // mounted() {},
    // beforeUpdate() {},
    // updated() {},
    // activated() {},
    // deactivated() {},
    // beforeDestroy() {},
    // destroyed() {},

    // methods: {},
    // render() {},
  };
</script>

<style lang="scss">
  .s-layout > :first-child {
    height: 100vh;
  }
</style>
