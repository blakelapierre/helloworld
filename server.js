var express = require('express'),
	fs = require('fs')
	log = require('./log.js').Log();

exports.startServer = function(config, callback) {
    var app = express(),
		port = config.server.port;

	app.use(express.static(__dirname + '/public'));

	app.get('/', function(req, res) {});

	var webserver = app.listen(port),
		io = require('socket.io').listen(webserver);

	io.set('log level', 0);

	var simulator = require('./public/game/simulator.js').simulator(20, {log: log}),
	    world = simulator.world;


	var id = 0,
	    clients = [];

	io.sockets.on('connection', function(socket) {
	    clients.push(socket);

	    socket.send(socket.id);
	    console.log(id++, socket.id);

	    var player;
	    socket.on('joinGame', function(data) {
	        socket.player = player = simulator.addPlayer(data.name, data.image);
	        simulator.runWorldToNow();
	        sendWorld('welcome');
	        socket.broadcast.emit('newPlayer', {player: player});
	        socket.sendWorld = sendWorld;
	        simulator.adminControls.startRace();
	    });

	    socket.on('controls', function(data) {
	    	simulator.worldControls.addEvent(simulator.world.state.step + 1, {type: 'controls', id: socket.player.id, controls: data.controls});
	    	socket.broadcast.emit('controls', {id: socket.player.id, controls: data.controls});
	    });

	    socket.on('setFace', function(data) {
	        var base64Data = data.image.replace(/^data:image\/png;base64,/,""),
	        	fileName = __dirname + '/public/images/faces/' + player.id + '.png';

	        console.log('Writing new face', fileName);
	        fs.writeFile(fileName, base64Data, 'base64', function(err) {
	        	if (err) console.log(err);
	        });
	        io.sockets.emit('faceChange', {playerID: player.id, face: '/images/faces/' + player.id + '.png'});
	    });

	    socket.on('disconnect', function() {
	        clients.splice(clients.indexOf(socket), 1);

	        if (socket.player) {
	        	console.log('removed', socket.player.name);
	        	simulator.removePlayer(socket.player.id);
	        	delete socket.player;
	        }
	        
	        delete io.sockets.socket[socket.id];
	    });

	    socket.on('ping', function() {
	    	socket.emit('pong', {time: new Date().getTime()});
	    });

	    socket.on('pong', function() {
	    	var now = new Date().getTime();
	    	player.latency = now - player.pingStart;
	    });

	    var sendWorld = function(name) {
	        socket.emit(name || 'world', {
	            socketID: socket.id,
	            world: world,
	            playerID: socket.player ? socket.player.id : null,
	            currentTime: new Date().getTime()
	        });
	    };

	    socket.sendWorld = function() {};
	});

	var start = null;
	setInterval(function() {
	    if (start == null) start = new Date().getTime();
	    
	    var update = {
	    	step: world.state.step,
	    	events: simulator.worldControls.getEvents()
	    };

	    if (world.state.step % 40 == 0) {
	    	update.metrics = _.map(simulator.worldControls.getPlayers(), function(player) {
	    		return {
	    			id: player.id,
	    			step: world.state.step,
	    			position: player.state.metrics.position,
	    			direction: player.state.metrics.direction
	    		};
	    	});
	    }

	    io.sockets.emit('update', update);

	    simulator.runWorldToNow();


	    if (world.step % 100 == 0) {
		    for (var i = 0; i < clients.length; i++) {
		    	var client = clients[i];
		    	client.sendWorld();
		    }
		}

	    if (world.step % 100 == 0) {
	        var now = new Date().getTime();

	        _.each(clients, function(client) {
	        	if (client.player) client.player.pingStart = now;
	        });

	        io.sockets.emit('ping');
	    }
	}, 20);

	//console.log('Listening on ' + port);
	log.info('Listening on ' + port);

	return callback(webserver, io);
};

var config = {
	server: {
		port: 3006
	}
};

exports.startServer(config, function(webserver, io) {

});