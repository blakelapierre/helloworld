var startServer = function(config, callback) {
	var express = require('express'),
		socketIO = require('socket.io'),
		webRTC = require('webrtc.io'),
		path = require('path'),
		app = express();

	app.use(express.static(path.join(__dirname, '/public')));	

	var webserver = app.listen(config.port),
		io = socketIO.listen(webserver),
		rtc = webRTC.listen(config.rtcport);

	io.set('log level', 0);

	return callback(webserver, io, rtc);
};

exports.startServer = startServer;
exports.startServer({
	port: 3006,
	rtcport: 3007
}, function(webserver, io, rtc) {});