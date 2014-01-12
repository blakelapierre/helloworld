if (typeof require === 'function' || window.require) {
    _ = require('underscore');
    vec3 = require('../gl-matrix-min.js').vec3;
};

var faceraceSimulator = (function() {
    return function(stepSize) {
        var dt = stepSize / 1000;
        var nextPlayerID = 0;
        var players = [],
            world = {
                step: 0,
                start: new Date().getTime(),
                course: {
                    image: '/images/course.png',
                    size: [2400, 2400],
                    startPosition: [100, 100, 100],
                    stars: []
                },
                playerMap: {},
                players: players
            };

        for (var i = 0; i < 50; i++) {
            world.course.stars.push({
                position: [400, 500 + (20 * i), 30],
                orientation: [-90, 0, 0]
            });
        }

        var friction = 0.01;

        var addPlayer = function() {
            var player = arguments[0];
            if (typeof player !== 'object') {
                var name = player || 'NO NAME!',
                    image = arguments[1] || '/images/faces/default.png';

                player = {
                    name: name,
                    orientation: [-90, 0, 0],
                    position: [0, 0, 44],
                    velocity: [0, 0, 0],
                    acceleration: [0, 0, 0],
                    direction: 0,
                    directionVector: [0, 1, 0],
                    controls: {
                        left: false,
                        up: false,
                        right: false,
                        down: false,
                        space: false,
                        orientation: [0, 0, 0],
                        calibration: [0, 0, 0]
                    },
                    vehicle: {
                        speed: 6,
                        boostSpeed: 10,
                        turnSpeed: Math.PI / 2
                    },
                    face: image,
                    scale: 0.25
                };
            }

            player.id = nextPlayerID++;
            world.playerMap[player.id] = world.players.length;
            world.players.push(player);

            return player;
        };

        var removePlayer = function(player) {
            var id = player.id,
                index = world.playerMap[id];
            world.players.splice(index, 1);
            delete world.playerMap[id];
        };

        var processStep = function() {
            _.each(players, processPlayerStep);
            world.step++;
        };

        var processPlayerStep = function(player) {
            var acceleration = vec3.create();

            // Apply friction
            vec3.scale(player.velocity, player.velocity, (1 - dt) * (1 - friction));

            // If we get too slow, we just stop
            var linearVelocity = vec3.length(player.velocity);
            if (linearVelocity < 0.5) vec3.set(player.velocity, 0, 0, 0);


            var orientation = [0, 0, 0];
            vec3.sub(orientation, player.controls.orientation, player.controls.calibration);

            var angle = orientation[2];
            if (angle > 180) angle -= 360;
            player.direction += 0.025 * player.vehicle.turnSpeed * angle * dt;

            // Handle inputs
            if (player.controls.left) {
                player.direction = (player.direction - (player.vehicle.turnSpeed * dt));
            }
            if (player.controls.right) {
                player.direction = (player.direction + (player.vehicle.turnSpeed * dt));
            }

            vec3.set(player.directionVector, Math.sin(player.direction), Math.cos(player.direction), 0);


            var vehicleSpeed = player.vehicle.speed;

            if (player.controls.space) vehicleSpeed += player.vehicle.boostSpeed;

            if (player.controls.up) {
                vec3.scale(acceleration, player.directionVector, vehicleSpeed * dt);
                vec3.add(acceleration, player.acceleration, acceleration);
            }
            if (player.controls.down) {
                vec3.scale(acceleration, player.directionVector, vehicleSpeed * dt);
                vec3.sub(acceleration, player.acceleration, acceleration);
            }

            var accelerationMagnitude = vec3.length(acceleration);
            if (accelerationMagnitude > vehicleSpeed) accelerationMagnitude = vehicleSpeed;

            var previousDirection = vec3.create();

            var velocity = player.velocity,
                speed = vec3.length(velocity);

            if (speed > 0) vec3.normalize(previousDirection, velocity);
            else previousDirection = player.directionVector;

            vec3.scale(velocity, player.directionVector, speed);
            vec3.scale(acceleration, previousDirection, accelerationMagnitude);

            vec3.add(velocity, velocity, acceleration);

            vec3.set(player.acceleration, acceleration[0], acceleration[1], acceleration[2]);

            var stepVelocity = vec3.create();
            vec3.scale(stepVelocity, player.velocity, dt);
            vec3.add(player.position, player.position, stepVelocity);

            player.orientation[1] = player.direction / Math.PI * 180;
        };

        var startSimulation = function() {
            world.step = 0;
            world.start = new Date().getTime();

            var startPosition = world.course.startPosition;
            _.each(world.players, function(player) {
                vec3.copy(player.position, startPosition);
            });
        };

        var runSimulationToNow = function() {
            var now = new Date().getTime(),
                steps = (now - world.start) / stepSize;

            for (var i = world.step; i <= steps; i++) {
                processStep();
            }
        };

        return {
            world: world,
            addPlayer: addPlayer,
            removePlayer: removePlayer,
            startSimulation: startSimulation,
            runSimulationToNow: runSimulationToNow
        };
    };
})();

var exports = exports || {};
exports.simulator = faceraceSimulator;