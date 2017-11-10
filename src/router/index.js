import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

// Route-level code splitting.
const ListStubsView = () => import('../views/ListStubsView.vue')

export function createRouter () {
  return new Router({
    mode: 'history',
    fallback: false,
    scrollBehavior: () => ({ y: 0 }),
    routes: [
      { path: '/', component: ListStubsView }
    ]
  })
}
