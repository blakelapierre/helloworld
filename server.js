var express = require('express'),
    fs = require('fs'),
    log = require('./log.js').Log();

exports.startServer = function(config, callback) {
    var app = express(),
        port = config.server.port;

    app.use(express.static(__dirname + '/public'));

    app.get('/', function(req, res) {});

    var webserver = app.listen(port),
        io = require('socket.io').listen(webserver);

    io.set('log level', 0);

    var stepSize = 20;

    var games = [],
        simulator = require('./public/game/simulator.js').Simulator({
            stepSize: stepSize,
            worldConfig: {
                predict: false,
                isClient: false
            },
            messageHandler: function(messages) {
                _.each(messages, function(message) {
                    switch (message.type) {
                        case 'callback':
                            message.callback();
                            break;
                    }
                    // if (message.playerID != null) { // could be 0!
                    // 	var socket = game.clientMap[message.playerID];
                    // 	socket.emit(message);
                    // }
                    // else {
                    // 	io.sockets.emit(message);
                    // }
                });
            }
        }),
        world = simulator.getWorld(),
        nextGameID = 0;

    var game = {
        id: nextGameID++,
        simulator: simulator,
        world: world,
        clients: [],
        clientMap: {}
    };

    games.push(game);

    io.sockets.on('connection', function(socket) {
        game.clients.push(socket);

        console.log(socket.id, 'connected');

        // 	socket.send('games', {
        // 	    games: _.map(games, function(game) {
        // 		return {
        // 		    id: game.id,
        // 		    numPlayers: game.clients.length
        // 		};
        // 	    })
        // 	});

        var player;
        socket.on('join', function(data) {
            simulator.addPlayer(data, function(p) {
                socket.player = player = p;
                game.clientMap[p.id] = socket;
                socket.emit('world', {
                    playerID: player.id,
                    world: world.getWorldState(),
                    currentTime: new Date().getTime()
                });
            });
        });

        socket.on('face', function(data) {
            // possible race condition with 'join' above!
            var base64Data = data.image.replace(/^data:image\/png;base64,/, ""),
                fileName = __dirname + '/public/images/faces/' + player.id + '.png';

            fs.writeFile(fileName, base64Data, 'base64', function(err) {
                if (err) console.log(err);
            });
            io.sockets.emit('face', {
                playerID: player.id,
                face: '/images/faces/' + player.id + '.png'
            });
        });

        socket.on('disconnect', function() {
            game.clients.splice(game.clients.indexOf(socket), 1);

            if (socket.player) {
                console.log('removed', socket.player.meta.name);
                simulator.removePlayer(socket.player);
                delete game.clientMap[socket.player.id];
                delete socket.player;
            }
            delete io.sockets.socket[socket.id];
        });

        socket.on('ping', function() {
            socket.emit('pong', {
                time: new Date().getTime()
            });
        });

        socket.on('pong', function() {
            var now = new Date().getTime();
            player.meta.latency = now - socket.pingStart;
        });
    });


    var stateUpdateRate = stepSize * 5,
        pingRate = stepSize * 5;

    setInterval(function() {
        simulator.stepWorldToNow();

        var update = {
            step: world.state.step
        };

        if (world.state.step % stateUpdateRate == 0) {
            update.state = simulator.getWorld().getWorldState();
        }

        io.sockets.emit('update', update);

        if (world.state.step % pingRate == 0) {
            var now = new Date().getTime();

            _.each(game.clients, function(socket) {
                socket._pingStart = now;
            });
            io.sockets.emit('ping');
        }
    }, stepSize);

    log.info('Listening on' + port);

    return callback(webserver, io);
};

var config = {
    server: {
        port: 3006
    }
};

exports.startServer(config, function(webserver, io) {});
