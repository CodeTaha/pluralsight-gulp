module.exports = function(){
	var client = './src/client/',
		clientApp = client+'app/',
		temp =  './.tmp/',
		server = './src/server/';

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
	return config;
};