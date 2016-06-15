var gulp = require('gulp'),
	$ = require('gulp-load-plugins')({lazy:true}),
	args = require('yargs').argv,
	del= require('del'),
	browserSync = require('browser-sync');

var config = require('./gulp.config')();
var port = process.env.PORT || config.defaultPort;

gulp.task('help', $.taskListing);

gulp.task('default', ['help']);

gulp.task('vet', function() {
	log('Analyzing source with JSHint and JSCS');
	gulp.src(config.alljs)
	.pipe($.if(args.verbose, $.print()))
	.pipe($.jscs())
	.pipe($.jshint())
	.pipe($.jshint.reporter('jshint-stylish', {verbose:true}))
	.pipe($.jshint.reporter('fail'));
});

gulp.task('fonts', ['clean-fonts'], function() {
	log('Copying fonts to build');

	return gulp
		.src(config.fonts)
		.pipe(gulp.dest(config.build + 'fonts'));
});

gulp.task('images', ['clean-images'], function() {
	log('Copying and compressing images to build');

	return gulp
		.src(config.images)
		.pipe($.imagemin({optimizationsLevel: 4}))
		.pipe(gulp.dest(config.build + 'images'));
});

gulp.task('styles',['clean-styles'], function() {
	log('Compiling Less --> CSS');

	return gulp
		.src(config.less)
		.pipe($.if(args.verbose, $.print()))
		.pipe($.plumber())
		.pipe($.less())
		.pipe($.autoprefixer({browsers:['last 2 version', '>5%']}))	
		.pipe(gulp.dest(config.temp));
});

gulp.task('wiredep', function(){
	log('Wire up bower css js and app js into html');
	var options = config.getWiredepDefaultOptions();
	var wiredep = require('wiredep').stream;
	
	return gulp
		.src(config.index)
		.pipe(wiredep(options))
		.pipe($.inject(gulp.src(config.js)))
		.pipe(gulp.dest(config.client));

});

gulp.task('inject', ['wiredep', 'styles', 'templatecache'], function(){
	log('inject css');
	
	return gulp
		.src(config.index)
		.pipe($.inject(gulp.src(config.css)))
		.pipe(gulp.dest(config.client));

});

gulp.task('optimize', ['inject'], function() {
  var assets, templateCache;
  log('Optimizing the javascript,css,html');
  templateCache = config.temp + config.templateCache.file;
  assets = $.useref({
    searchPath: './'
  });
  return gulp.src(config.index).pipe($.plumber()).pipe($.inject(gulp.src(templateCache, {
    read: false
  }), {
    starttag: '<!-- inject:template:js -->'
  })).pipe(assets).pipe(gulp.dest(config.build));
});

gulp.task('less-watcher', function(){
	gulp.watch([config.less], ['styles']);
});

gulp.task('templatecache', ['clean-code'], function() {
	log('Creating AngularJS $templateCache');
	return gulp
		.src(config.htmltemplates)
		.pipe($.minifyHtml({empty: true}))
		.pipe($.angularTemplatecache(
			config.templateCache.file,
			config.templateCache.options
		))
		.pipe(gulp.dest(config.temp));
});

gulp.task('clean', function(done) {
	var delconfig = [].concat(config.build, config.temp);
	log('Cleaning: ' + $.util.colors.blue(delconfig));
	del(delconfig).then(done());
});

gulp.task('clean-fonts', function(done) {
	clean(config.build +'fonts/**/*.*', done);
});

gulp.task('clean-images', function(done) {
	clean(config.build +'images/**/*.*', done);
});

gulp.task('clean-styles', function(done) {
	clean(config.temp +'**/*.css', done);
});

gulp.task('clean-code', function(done) {
	var files = [].concat(
			config.temp + '**/*.js',
			config.build + '**/*.html',
			config.build + 'js/**/*.js'
		);
	clean(files, done);
});

gulp.task('serve-build', ['optimize'], function() {
	serve(false /* isDev */);
});

gulp.task('serve-dev', ['inject'], function() {
	serve(true /* isDev */);
});

gulp.task('hello', function() {
	
});
//////
function serve(isDev) {
	var nodeOptions = {
		script: config.nodeServer,
		delayTime: 1,
		env: {
			'PORT': port,
			'NODE_ENV': isDev ? 'dev' : 'build'
		},
		watch: [config.server]
	};

	return $.nodemon(nodeOptions)
		.on('restart', ['vet'], function(ev) {
			log($.util.colors.green('*** NODEMON RESTARTED ***'));
			log('files changed on restart:\n' + ev);
			setTimeout(function() {
				browserSync.notify('reloading now ...');
				browserSync.reload({stream: false});
			}, config.browserReloadDelay);
		})
		.on('start', function(ev) {
			log($.util.colors.green('*** NODEMON STARTED ***'));
			startBrowserSync();
		})
		.on('crash', function() {
			log($.util.colors.red('*** NODEMON CRASHED!!! ***'));
		})
		.on('exit', function() {
			log('*** NODEMON EXITED CLEANLY ***');
		});
}

function changeEvent(event) {
	var srcPattern = new RegExp('/.*(?=/' + config.source + ')/');
	log('File ' + event.path.replace(srcPattern, '')+ ' ' + event.type);
}

function startBrowserSync(){
	if(args.nosync || browserSync.active){
		return;
	} else {
		log('Starting Browser-Sync on port ' + port);
		
		gulp.watch([config.less], ['styles'])
			.on('change', function(event) {
				changeEvent(event);
			});

		var options = {
			proxy: 'localhost:' + port,
			port: 3000,
			files: [
				config.client + '**/*.*',
				'!' + config.less,
				config.temp + '**/*.css'
			],
			ghostMode: {
				clicks: true,
				location: false,
				forms: true,
				scroll: true
			},
			injectCHanges: true,
			logFileChanges: true,
			logLevel: 'debug',
			logPrefix: 'glp-patterns',
			notify: true,
			reloadDelay: 0
		};

		browserSync(options);
	}
}

function clean(path, done){
	log('Cleaning ' + $.util.colors.yellow(path));
	del(path).then(done());
}

function log(msg){
	if(typeof(msg) === 'object') {
		for (var item in msg){
			if(msg.hasOwnProperty(item)) {
				$.util.log($.util.colors.blue(msg[item]));
			}
		}
	} else {
		$.util.log($.util.colors.blue(msg));
	}
}