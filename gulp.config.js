module.exports = function(){
	var client = './src/client/',
		clientApp = client+'app/',
		report = './report/',
		temp =  './.tmp/',
		server = './src/server/',
		root = './';
		var wiredep = require('wiredep');
		var bowerFiles = wiredep({devDependencies: true})['js'];
	var config = {
		/**
		* File paths
		*/
		alljs:[
			'./src/**/*.js',
			'./*.js'
		],
		build: './build/', 
		client: client,
		fonts: './bower_components/font-awesome/fonts/**/*.*',
		html: clientApp + '**/*.html',
		htmltemplates: clientApp + '**/*.html',
		images: client + 'images/**/*.*',
		index: client + 'index.html',
		js: [
			clientApp + '**/*.module.js',
			clientApp + '**/*.js',
			'!' + clientApp + '**/*.spec.js'
		],
		less: client + 'styles/styles.less',
		css: temp + 'styles.css',
		root: root,
		server: server,
		temp: temp,

		/*
		* template Cache
		*/
		templateCache: {
			file: 'templates.js',
			options: {
				module: 'app.core',
				standAlone: false,
				root: 'app/'
			}
		},

		/*
		* Browser-Sync
		*/
		browserReloadDelay: 1000,

		/*
		* Bower and NPM locations
		*/
		bower:{
			json: require('./bower.json'),
			directory: './bower_components',
			ignorePath: '../..'
		},	
		packages: [
			'./package.json',
			'./bower.json'
		],
		/*
		* Karma and testing settings
		*/
		specHelpers: [client + 'test-helpers/*.js'],
		serverIntegrationSpecs: [client + 'tests/server-integration/**/*.spec.js'],
		report: report,
		/*
		* Node Settings for server
		*/	
		defaultPort: 7203,
		nodeServer: server + 'app.js'
	};
	config.getWiredepDefaultOptions = function() {
		var options = {
			bowerJson: config.bower.json,
			directory: config.bower.directory,
			ignorePath: config.bower.ignorePath
		};

		return options;
	};
	config.karma = getKarmaOptions();
	return config;

	////////////
	function getKarmaOptions() {
		var options = {
			files: [].concat(
				bowerFiles,
				config.specHelpers,
				client + '**/*.module.js',
				client + '**/*.js',
				temp + config.templateCache.file,
				config.serverIntegrationSpecs
			),
			exclude: [],
			coverage: {
				dir: report + 'coverage',
				reporters: [
					{type:'html', subdir: 'report-html'},// for browser
					{type: 'lcov', subdir: 'report-lcov'},// for Jenkins etc
					{type: 'text-summary'} // for console
				]
			},
			preprocessors: {}
		};
		options.preprocessors[clientApp + '**/!(*.spec)+(.js)'] = ['coverage'];
		return options;
	}
};
