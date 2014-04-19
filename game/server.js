var startServer = function(config, callback) {
	getPublicAddress(function(address) {
		config.publicAddress = address;
		startServices(config, callback);
	});
};

var getPublicAddress = function(deliver) {
	var http = require('http');

	console.log('determining public ip address...');
	http.get('http://fugal.net/ip.cgi', function(res) {
	    if(res.statusCode != 200) {
	        throw new Error('non-OK status: ' + res.statusCode);
	    }
	    res.setEncoding('utf-8');
	    var ipAddress = '';
	    res.on('data', function(chunk) { ipAddress += chunk; });
	    res.on('end', function() {
	    	ipAddress = ipAddress.trim();
	    	console.log('Public Address: ' + ipAddress);
	        deliver(ipAddress);
	    });
	}).on('error', function(err) {
	    throw err;
	});
};

var startServices = function(config, callback) {
	var express = require('express'),
		bodyParser = require('body-parser'),
		socketIO = require('socket.io'),
		webRTC = require('webrtc.io'),
		nodemailer = require('nodemailer'),
		path = require('path'),
		app = express();

	app.use(bodyParser());
	app.use(express.static(path.join(__dirname, '/public')));

	var webserver = app.listen(config.port),
		rtc = webRTC.listen(config.rtcport),
		io = socketIO.listen(webserver);

	var mailer = nodemailer.createTransport('SMTP', {
		service: 'Gmail',
		auth: {
			user: 'hello.world.video.chat@gmail.com',
			pass: 'palebluedot'
		}
	});

	var roomSubscriptions = {
		'#facerace': ['blakelapierre@gmail.com']
	};

	var notifyRoomSubscriptions = function(room) {
		var subscriptions = roomSubscriptions[room] || [];

		for (var i = 0; i < subscriptions.length; i++) {
			mailer.sendMail({
				from: 'hello.world.video.chat@gmail.com',
				to: subscriptions[i],
				subject: 'Someone just joined ' + room,
				text: 'Join them: http://' + config.publicAddress + ':' + config.port 
			}, function(error, responseStatus) {
				console.log(arguments);
			});
		}
	};

	var invite = function(address, room) {
		mailer.sendMail({
			from: 'hello.world.video.chat@gmail.com',
			to: address,
			subject: 'Someone just invited you to video chat',
			text: 'Join them: http://' + config.publicAddress + ':' + config.port + room
		}, function(error, responseStatus) {
			console.log(arguments);
		});
	}

	rtc.rtc.on('join_room', function(data, socket) {
		notifyRoomSubscriptions(data.room);
	});

	var router = express.Router();

	router.get('/channels', function(req, res) {
		res.json(rtc.rtc.rooms);
	});

	router.post('/invite/:address', function(req, res) {
		var address = req.params.address,
			room = req.body;

		var data = ''
		req.on('data', function(chunk) {
			data += chunk.toString();
		});
		req.on('end', function() {
			var message = JSON.parse(data),
				room = message.room;

			invite(address, room);

			res.json({sent:true});
		});
	});

	app.use('/', router);

	return callback(webserver, io, rtc);
};

exports.startServer = startServer;
exports.startServer({
	port: 3006,
	rtcport: 3007
}, function(webserver, io, rtc) {});