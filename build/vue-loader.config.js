const process = require('process')

const isProduction = process.env.NODE_ENV === 'production'

module.exports = {
  extractCSS: isProduction,
  postcss: [
    require('autoprefixer')({
      browsers: ['last 3 versions']
    })
  ],
  preserveWhitespace: false
}
