/**
 * Adds an globalModal instance to Vue itself, which can be used by calling this.$globalModal.
 */
export default {
  install(Vue) {
    Vue.prototype.$globalModal = new Vue({
      data: {
        /**
         * Holds a list of open modal names (uuid).
         */
        openModals: [],
      },

      created() {
        window.addEventListener('keyup', this.onKeyUp);
      },

      beforeDestroy() {
        window.removeEventListener('keyup', this.onKeyUp);
      },

      methods: {
        /**
         * Keyup event function.
         *
         * @param {Object} event - Native event object.
         */
        onKeyUp(event) {
          if (event.keyCode === 27) {
            this.hideTopModal();
          }
        },

        /**
         * Hides the latest modal in the array.
         */
        hideTopModal() {
          const uuid = this.openModals[this.openModals.length - 1];

          this.$modal.hide(uuid);
        },

        /**
         * Removes the given modal from the array.
         *
         * @param {String} uuid - Name of the modal (uuid).
         */
        removeFromArray(uuid) {
          this.openModals.splice(this.openModals.indexOf(uuid), 1);
        },

        /**
         * Adds the given modal to the array.
         *
         * @param {String} uuid - Name of the modal (uuid).
         */
        addToArray(uuid) {
          this.openModals.push(uuid);
        }
      },
    });
  }
};
