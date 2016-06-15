gulp = require('gulp')
$ = require('gulp-load-plugins')(lazy: true)
args = require('yargs').argv
del = require('del')
browserSync = require('browser-sync')
config = require('./gulp.config')()
port = process.env.PORT or config.defaultPort


gulp.task 'help', $.taskListing

gulp.task 'default', [ 'help' ]

gulp.task 'vet', ->
  log 'Analyzing source with JSHint and JSCS'
  gulp.src(config.alljs).pipe($.if(args.verbose, $.print())).pipe($.jscs()).pipe($.jshint()).pipe($.jshint.reporter('jshint-stylish', verbose: true)).pipe $.jshint.reporter('fail')
  return

gulp.task 'fonts', [ 'clean-fonts' ], ->
  log 'Copying fonts to build'
  gulp.src(config.fonts).pipe gulp.dest(config.build + 'fonts')

gulp.task 'images', [ 'clean-images' ], ->
  log 'Copying and compressing images to build'
  gulp.src(config.images).pipe($.imagemin(optimizationsLevel: 4)).pipe gulp.dest(config.build + 'images')

gulp.task 'styles', [ 'clean-styles' ], ->
  log 'Compiling Less --> CSS'
  gulp.src(config.less).pipe($.if(args.verbose, $.print())).pipe($.plumber()).pipe($.less()).pipe($.autoprefixer(browsers: [
    'last 2 version'
    '>5%'
  ])).pipe gulp.dest(config.temp)

gulp.task 'wiredep', ->
  log 'Wire up bower css js and app js into html'
  options = config.getWiredepDefaultOptions()
  wiredep = require('wiredep').stream
  gulp.src(config.index).pipe(wiredep(options)).pipe($.inject(gulp.src(config.js))).pipe gulp.dest(config.client)

gulp.task 'inject', [
  'wiredep'
  'styles'
  'templatecache'
], ->
  log 'inject css'
  gulp.src(config.index).pipe($.inject(gulp.src(config.css))).pipe gulp.dest(config.client)

gulp.task 'serve-dev', [ 'inject' ], ->
  isDev = true
  nodeOptions = 
    script: config.nodeServer
    delayTime: 1
    env:
      'PORT': port
      'NODE_ENV': if isDev then 'dev' else 'build'
    watch: [ config.server ]
  $.nodemon(nodeOptions).on('restart', [ 'vet' ], (ev) ->
    log $.util.colors.green('*** NODEMON RESTARTED ***')
    log 'files changed on restart:\n' + ev
    setTimeout (->
      browserSync.notify 'reloading now ...'
      browserSync.reload stream: false
      return
    ), config.browserReloadDelay
    return
  ).on('start', (ev) ->
    log $.util.colors.green('*** NODEMON STARTED ***')
    startBrowserSync()
    return
  ).on('crash', ->
    log $.util.colors.red('*** NODEMON CRASHED!!! ***')
    return
  ).on 'exit', ->
    log '*** NODEMON EXITED CLEANLY ***'
    return

gulp.task 'optimize', [ 'inject' ], ->
  log 'Optimizing the javascript,css,html'
  
  templateCache = config.temp + config.templateCache.file
  assets = $.useref({searchPath: './'})

  gulp.src(config.index)
  	.pipe($.plumber())
  	.pipe($.inject(gulp.src(templateCache, {read: false}), 
  		starttag: '<!-- inject:template:js -->'
  		))
  	.pipe(assets)
  	.pipe gulp.dest(config.build)

gulp.task 'less-watcher', ->
  gulp.watch [ config.less ], [ 'styles' ]
  return

gulp.task 'templatecache', [ 'clean-code' ], ->
  log 'Creating AngularJS $templateCache'
  gulp.src(config.htmltemplates).pipe($.minifyHtml(empty: true)).pipe($.angularTemplatecache(config.templateCache.file, config.templateCache.options)).pipe gulp.dest(config.temp)

gulp.task 'clean', (done) ->
  delconfig = [].concat(config.build, config.temp)
  log 'Cleaning: ' + $.util.colors.blue(delconfig)
  del(delconfig).then done()
  return

gulp.task 'clean-fonts', (done) ->
  clean config.build + 'fonts/**/*.*', done
  return

gulp.task 'clean-images', (done) ->
  clean config.build + 'images/**/*.*', done
  return

gulp.task 'clean-styles', (done) ->
  clean config.temp + '**/*.css', done
  return

gulp.task 'clean-code', (done) ->
  files = [].concat(config.temp + '**/*.js', config.build + '**/*.html', config.build + 'js/**/*.js')
  clean files, done
  return

gulp.task 'hello', ->


# Helper functions

changeEvent = (event) ->
  srcPattern = new RegExp('/.*(?=/' + config.source + ')/')
  log 'File ' + event.path.replace(srcPattern, '') + ' ' + event.type
  return

startBrowserSync = ->
  if args.nosync or browserSync.active
    return
  else
    log 'Starting Browser-Sync on port ' + port
    gulp.watch([ config.less ], [ 'styles' ]).on 'change', (event) ->
      changeEvent event
      return
    options = 
      proxy: 'localhost:' + port
      port: 3000
      files: [
        config.client + '**/*.*'
        '!' + config.less
        config.temp + '**/*.css'
      ]
      ghostMode:
        clicks: true
        location: false
        forms: true
        scroll: true
      injectCHanges: true
      logFileChanges: true
      logLevel: 'debug'
      logPrefix: 'glp-patterns'
      notify: true
      reloadDelay: 0
    browserSync options
  return

clean = (path, done) ->
  log 'Cleaning ' + $.util.colors.yellow(path)
  del(path).then done()
  return

log = (msg) ->
  if typeof msg == 'object'
    for item of msg
      if msg.hasOwnProperty(item)
        $.util.log $.util.colors.blue(msg[item])
  else
    $.util.log $.util.colors.blue(msg)
  return