import Vue from 'vue'
import Router from 'vue-router'
import GdMapRouter from '@/components/Index'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'GdMapRouter',
      component: GdMapRouter
    }
  ]
})
