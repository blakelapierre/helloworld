module.exports = function(grunt) {
	var pkg = grunt.file.readJSON('package.json');

	grunt.initConfig({
		pkg: pkg,
		bgShell: {
		    _defaults: {
			    bg: true
		    },
		    startServer: {
			    cmd: 'node server.js',
			    bg: false
		    },
		    startClient: {
			    cmd: 'xdg-open http://localhost:3006'
		    }
		}
	});

	grunt.loadNpmTasks('grunt-bg-shell');
	grunt.loadNpmTasks('grunt-browserify'); // look into this

	grunt.registerTask('default' , '', function(numberClients) {
		numberClients = numberClients || 1;

		for (var i = 0; i < numberClients; ++i) {
			grunt.task.run('bgShell:startClient');
		}
		grunt.task.run('bgShell:startServer');
	});
    
    grunt.registerTask('localDeploy', '', function() {
        grunt.task.run('bgShell:startServer');
    });
};