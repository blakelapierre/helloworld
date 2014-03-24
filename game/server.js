var startServer = function(config, callback) {
	var express = require('express'),
		socketIO = require('socket.io'),
		path = require('path'),
		app = express();

	app.use(express.static(path.join(__dirname, '/public')));	

	var webserver = app.listen(config.port),
		io = socketIO.listen(webserver);

	io.set('log level', 0);

	return callback(webserver, io);
};

exports.startServer = startServer;
exports.startServer({
	port: 3006
}, function(webserver, io) {});