var express = require('express'),
	app = express(),
	port = 3006;

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) { });

var io = require('socket.io').listen(app.listen(port));
io.set('log level', 0);

var simulator = require('./public/js/facerace/simulator.js').simulator(20),
	world = simulator.world;


var i = 0;
io.sockets.on('connection', function(socket) {
	socket.send(socket.id);
	console.log(i++, socket.id);

	var player;
	socket.on('joinGame', function(data) {
		socket.player = simulator.addPlayer(data.name, data.image);
		simulator.runSimulationToNow();
		sendWorld('welcome');
	});

	socket.on('controls', function(data) {
		_.extend(socket.player.controls, data.controls);
	});

	socket.on('position', function(data) {
		console.dir(data);
	});

	socket.on('disconnect', function() {
		if (socket.player) simulator.removePlayer(socket.player);
	});

	var sendWorld = function(name) {
		io.sockets.emit(name || 'world', {world: simulator.world, playerID: socket.player ? socket.player.id : null});
	};

	var start = null;
	setInterval(function() {
		if (start == null) start = new Date().getTime();
		simulator.runSimulationToNow();
		
		sendWorld();

		if (world.step % 100 == 0) {
			var time = new Date().getTime();
			//console.log(world.step, (time - start) / 1000);
		}
	}, 20);
});

console.log('Listening on ' + port);