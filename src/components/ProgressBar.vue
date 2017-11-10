<!-- borrowed from Nuxt! -->

<template>
  <div class="progress" :style="{
    'width': percent+'%',
    'height': height,
    'background-color': canSuccess? color : failedColor,
    'opacity': show ? 1 : 0
  }"></div>
</template>

<script>
export default {
  data () {
    return {
      canSuccess: true,
      color: '#ffca2b',
      duration: 3000,
      failedColor: '#ff0000',
      height: '2px',
      percent: 0,
      show: false
    }
  },
  methods: {
    decrease (num) {
      this.percent = this.percent - Math.floor(num)
      return this
    },
    fail () {
      this.canSuccess = false
      return this
    },
    finish () {
      this.percent = 100
      this.hide()
      return this
    },
    get () {
      return Math.floor(this.percent)
    },
    hide () {
      clearInterval(this._timer)
      this._timer = null
      setTimeout(() => {
        this.show = false
        this.$nextTick(() => {
          setTimeout(() => {
            this.percent = 0
          }, 200)
        })
      }, 500)
      return this
    },
    increase (num) {
      this.percent = this.percent + Math.floor(num)
      return this
    },
    pause () {
      clearInterval(this._timer)
      return this
    },
    set (num) {
      this.show = true
      this.canSuccess = true
      this.percent = Math.floor(num)
      return this
    },
    start () {
      this.show = true
      this.canSuccess = true
      if (this._timer) {
        clearInterval(this._timer)
        this.percent = 0
      }
      this._cut = 10000 / Math.floor(this.duration)
      this._timer = setInterval(() => {
        this.increase(this._cut * Math.random())
        if (this.percent > 95) {
          this.finish()
        }
      }, 100)
      return this
    }
  }
}
</script>

<style lang="scss" scoped>
.progress {
  background-color: #efc14e;
  height: 2px;
  left: 0px;
  opacity: 1;
  position: fixed;
  right: 0px;
  top: 0px;
  transition: width 0.2s, opacity 0.4s;
  z-index: 999999;
  width: 0%;
}
</style>
