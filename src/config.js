const process = require('process')
const dotenv = require('dotenv')

const isProduction = process.env.NODE_ENV === 'production'

if (!isProduction) {
  dotenv.load()
}

const config = {}

config.seq = {
  url: process.env.SEQ_URL
}

module.exports = config
