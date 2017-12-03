import process from 'process'

const clientTitleMixin = {
  mounted () {
    const title = getTitle(this)

    if (title) {
      document.title = `Stubbl | ${title}`
    }
  }
}

const serverTitleMixin = {
  created () {
    const title = getTitle(this)

    if (title) {
      this.$ssrContext.title = `Stubbl | ${title}`
    }
  }
}

function getTitle (vm) {
  const { title } = vm.$options

  if (title) {
    return typeof title === 'function'
      ? title.call(vm)
      : title
  }
}

export default process.env.VUE_ENV === 'server'
  ? serverTitleMixin
  : clientTitleMixin
