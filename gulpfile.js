var gulp = require('gulp'),
	$ = require('gulp-load-plugins')({lazy:true}),
	args = require('yargs').argv;

var config = require('./gulp.config')();

gulp.task('hello-world', function() {
	
});

gulp.task('vet', function() {
	log('Analyzing source with JSHint and JSCS');
	gulp.src(config.alljs)
	.pipe($.if(args.verbose, $.print()))
	.pipe($.jscs())
	.pipe($.jshint())
	.pipe($.jshint.reporter('jshint-stylish', {verbose:true}))
	.pipe($.jshint.reporter('fail'));
});

gulp.task('styles', function() {
	log('Compiling Less --> CSS');

	return gulp
		.src(config.less)
		.pipe($.if(args.verbose, $.print()))
		.pipe($.less())
		.pipe($.autoprefixer({browsers:['last 2 version', '>5%']}))	
		.pipe(gulp.dest(config.temp));
});

//////

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