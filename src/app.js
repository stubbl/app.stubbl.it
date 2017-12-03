import Vue from 'vue'
import App from './App.vue'
import { createStore } from './store'
import { createRouter } from './router'
import { sync } from 'vuex-router-sync'
import titleMixin from './common/titleMixin'
import * as filters from './common/filters'

// Mixin for handling the title.
Vue.mixin(titleMixin)

// Register global utility filters.
Object.keys(filters).forEach(key => {
  Vue.filter(key, filters[key])
})

// Expose a factory function that creates a fresh set of store, router,
// app instances on each call (which is called for each SSR request).
export function createApp () {
  // Create store and router instances.
  const store = createStore()
  const router = createRouter()

  // Sync the router with the vuex store.
  // This registers `store.state.route`.
  sync(store, router)

  // Create the app instance.
  // We inject the router, store and SSR context to all child components,
  // making them available everywhere as `this.$router` and `this.$store`.
  const app = new Vue({
    router,
    store,
    render: h => h(App)
  })

  // Expose the app, the router and the store.
  // We are not mounting the app, since bootstrapping will be
  // different depending on whether we are in a browser or on the server.
  return { app, router, store }
}
