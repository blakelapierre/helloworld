var express = require('express'),
	fs = require('fs'),
    app = express(),
	port = 3006;

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {});

var io = require('socket.io').listen(app.listen(port));
io.set('log level', 0);

var simulator = require('./public/js/facerace/simulator2.js').simulator(20),
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
    });

    socket.on('controls', function(data) {
    	simulator.setPlayerControls(socket.player, data.controls);
    });

    socket.on('setFace', function(data) {
        var base64Data = data.image.replace(/^data:image\/png;base64,/,""),
        	fileName = __dirname + '/public/images/faces/' + player.name + '.png';

        console.log('Writing new face', fileName);
        fs.writeFile(fileName, base64Data, 'base64', function(err) {
        	if (err) console.log(err);
        });
    });

    socket.on('disconnect', function() {
        clients.splice(clients.indexOf(socket), 1);

        if (socket.player) simulator.removePlayer(socket.player);
        
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
            playerID: socket.player ? socket.player.id : null
        });
    };

    socket.sendWorld = sendWorld;
});

var start = null;
setInterval(function() {
    if (start == null) start = new Date().getTime();
    simulator.runWorldToNow();

    for (var i = 0; i < clients.length; i++) clients[i].sendWorld();

    if (world.step % 100 == 0) {
        var now = new Date().getTime();

        _.each(clients, function(client) {
        	if (client.player) client.player.pingStart = now;
        });

        io.sockets.emit('ping');
    }
}, 20);

console.log('Listening on ' + port);