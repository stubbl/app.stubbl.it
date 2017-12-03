const process = require('process')
const config = require('./src/config')

const seq = require('seq-logging')
const logger = new seq.Logger({ serverUrl: config.seq.url })

const fs = require('fs')
const path = require('path')
const LRU = require('lru-cache')
const express = require('express')
const favicon = require('serve-favicon')
const compression = require('compression')
const microcache = require('route-cache')
const resolve = file => path.resolve(__dirname, file)
const {
  createBundleRenderer
} = require('vue-server-renderer')

const isProduction = process.env.NODE_ENV === 'production'
const useMicroCache = process.env.MICRO_CACHE !== 'false'
const serverInfo =
  `express/${require('express/package.json').version} ` +
  `vue-server-renderer/${require('vue-server-renderer/package.json').version}`

const app = express()

function createRenderer (bundle, options) {
  // https://github.com/vuejs/vue/blob/dev/packages/vue-server-renderer/README.md#why-use-bundlerenderer
  return createBundleRenderer(bundle, Object.assign(options, {
    // Component caching.
    cache: LRU({
      max: 1000,
      maxAge: 1000 * 60 * 15
    }),
    // This is only needed when vue-server-renderer is npm-linked.
    basedir: resolve('./dist'),
    // Recommended for performance.
    runInNewContext: false
  }))
}

let renderer
let readyPromise
const templatePath = resolve('./src/index.template.html')

if (isProduction) {
  // Create server renderer using template and built server bundle.
  // The server bundle is generated by vue-ssr-webpack-plugin.
  const template = fs.readFileSync(templatePath, 'utf-8')
  const bundle = require('./dist/vue-ssr-server-bundle.json')
  // The client manifests are optional, but it allows the renderer
  // to automatically infer preload/prefetch links and directly add <script>
  // tags for any async chunks used during render, avoiding waterfall requests.
  const clientManifest = require('./dist/vue-ssr-client-manifest.json')

  renderer = createRenderer(bundle, {
    template,
    clientManifest
  })
} else {
  // Setup the dev server with watch and hot-reload,
  // and create a new renderer on bundle / index template update.
  readyPromise = require('./build/dev-server')(
    app,
    templatePath,
    (bundle, options) => {
      renderer = createRenderer(bundle, options)
    }
  )
}

const serve = (path, cache) => express.static(resolve(path), {
  maxAge: cache && isProduction ? 1000 * 60 * 60 * 24 * 30 : 0
})

app.use(compression({
  threshold: 0
}))
app.use(favicon('./public/logo-48.png'))
app.use('/dist', serve('./dist', true))
app.use('/public', serve('./public', true))
app.use('/manifest.json', serve('./manifest.json', true))
app.use('/service-worker.js', serve('./dist/service-worker.js'))

// Since this app has no user-specific content, every page is micro-cacheable.
// If your app involves user-specific content, you need to implement custom
// logic to determine whether a request is cacheable based on its url and
// headers.
// 1-second microcache.
// https://www.nginx.com/blog/benefits-of-microcaching-nginx/
app.use(microcache.cacheSeconds(1, request => useMicroCache && request.originalUrl))

function render (request, response) {
  const requestStartedAt = Date.now()

  response.setHeader('Content-Type', 'text/html')
  response.setHeader('Server', serverInfo)

  const handleError = error => {
    if (error.url) {
      response.redirect(error.url)
    } else if (error.code === 404) {
      response.status(404).send('404 | Page Not Found')
    } else {
      logger.emit({
        level: 'Warning',
        timestamp: new Date(),
        messageTemplate: 'Error during render. ErrorMessage="{ErrorMessage}" RequestUrl="{RequestUrl}"',
        properties: {
          ErrorMessage: error.message,
          RequestUrl: request.url
        }
      })

      // Render error page or redirect.
      response.status(500).send('500 | Internal Server Error')

      console.error(`Error during render. ErrorMessage="${error.message}" RequestUrl="${request.url}"`)
      console.error(error.stack)
    }
  }

  const context = {
    title: 'Stubbl',
    url: request.url
  }

  renderer.renderToString(context, (error, html) => {
    if (error) {
      return handleError(error)
    }

    response.send(html)

    if (!isProduction) {
      console.log(`Request: ${Date.now() - requestStartedAt}ms`)
    }
  })
}

app.get('*', isProduction ? render : (request, response) => {
  readyPromise.then(() => render(request, response))
})

const port = process.env.PORT || 8080

app.listen(port, () => {
  console.log(`Server started at localhost:${port}`)
})
