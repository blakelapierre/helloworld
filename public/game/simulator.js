if (typeof require === 'function' || window.require) {
    _ = require('underscore');
    vec3 = require('../gl-matrix-min.js').vec3;
};

var faceraceSimulator = (function() {
    return function(stepSize) {
        var dt = stepSize / 1000;
        var nextPlayerID = 0;
        var simulator = {
        		world: {
	                step: 0,
	                start: new Date().getTime(),
	                course: {
	                    image: '/images/course.png',
	                    size: [2400, 2400],
	                    startPosition: [100, 100, 100],
	                    stars: []
	                },
	                playerMap: {},
	                players: [],
	                friction: 0.01
	            }
	        },
	        world = simulator.world,
        	players = world.players,
            worldBuffer = [],
			worldBufferSize = 100;

        for (var i = 0; i < 50; i++) {
            world.course.stars.push({
                position: [400, 500 + (20 * i), 30],
                orientation: [-90, 0, 0]
            });
        }

        var addPlayer = function() {
            var player = arguments[0];
            if (typeof player !== 'object') {
                var name = player || 'NO NAME!',
                    image = arguments[1] || '/images/faces/default.png';

				player = {
					name: name,
					orientation: [-90, 0, 0],
					position: [0, 0, 11],
					velocity: [0, 0, 0],
					acceleration: [0, 0, 0],
					direction: 0,
					directionVector: [0, 1, 0],
					lastTurn: [0, 0, 0],
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
					scale: 2,
					pingStart: 0,
					latency: 0
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

        var processPlayerStep = (function() {
        	var acceleration = vec3.create(),
        		velocity = vec3.create(),
        		position = vec3.create(),
        		orientation = vec3.create(),
        		stepVelocity = vec3.create(),
        		directionVector = vec3.create(),
        		previousDirection = vec3.create(),
        		vehicleSpeed = 0,
        		speed = 0,
        		direction = 0,
        		turnSpeed = 0;

        	return function(oldWorld, newWorld, playerIndex) {
	            var player = oldWorld.players[playerIndex], // need to use a hashtable
	            	newPlayer = newWorld.players[playerIndex], // need to use a hashtable
	            	controls = player.controls;

	            // Apply friction
	            vec3.scale(velocity, player.velocity, (1 - dt) * (1 - world.friction));

	            // If we get too slow, we just stop
	            speed = vec3.length(velocity);
	            if (speed < 0.5) {
	            	vec3.set(velocity, 0, 0, 0);
	            	speed = 0;
	            }


	            
	            vec3.sub(orientation, controls.orientation, controls.calibration);

	            turnSpeed = player.vehicle.turnSpeed;

	            var angle = orientation[1];
	            if (angle > 180) angle -= 360;
	            direction += 0.025 * turnSpeed * angle * dt;

	            // Handle inputs
	            if (controls.left) {
	                direction = (direction - (turnSpeed * dt));
	            }
	            if (controls.right) {
	                direction = (direction + (turnSpeed * dt));
	            }

	            vec3.set(directionVector, Math.sin(direction), Math.cos(direction), 0);
	            


	            var vehicleAcceleration = player.vehicle.speed,
	            	boostAcceleration = player.vehicle.boostSpeed;

	            if (controls.space) vehicleAcceleration += boostAcceleration;

	            if (controls.up) {
	                vec3.scale(acceleration, directionVector, vehicleAcceleration * dt);
	            }
	            if (player.controls.down) {
	                vec3.scale(acceleration, directionVector, -vehicleAcceleration * dt);
	            }

	            var accelerationMagnitude = vec3.length(acceleration);
	            if (accelerationMagnitude > vehicleSpeed) accelerationMagnitude = vehicleAcceleration;

	            

	            if (speed > 0) vec3.normalize(previousDirection, velocity);
	            else previousDirection = directionVector;

	            vec3.sub(newPlayer.lastTurn, directionVector, previousDirection);

	            vec3.scale(velocity, directionVector, speed);
	            vec3.scale(acceleration, previousDirection, accelerationMagnitude);

	            vec3.add(velocity, velocity, acceleration);

	            vec3.scale(stepVelocity, velocity, dt);

	            vec3.copy(position, player.position);
	            vec3.add(position, position, stepVelocity);

	            vec3.copy(newPlayer.directionVector, directionVector);

	            vec3.copy(newPlayer.acceleration, acceleration);
	            vec3.copy(newPlayer.velocity, velocity);
	            vec3.copy(newPlayer.position, position);

	            player.orientation[1] = player.direction / Math.PI * 180;
	        };
	    })();

        var startSimulation = function() {
            world.step = 0;
            world.start = new Date().getTime();

            var startPosition = world.course.startPosition;
            _.each(world.players, function(player) {
                vec3.copy(player.position, startPosition);
            });
        };

        var stepWorld = function(oldWorld) {
        	var nextWorld = getNextWorld(oldWorld);

        	for (var i = 0; i < nextWorld.players.length; i++) {
        		processPlayerStep(nextWorld, oldWorld, i);
        	}

        	return nextWorld;
        };

        var runWorldToNow = function() {
        	var now = now || new Date().getTime(),
        		currentStep = currentStep || Math.floor((now - world.start) / stepSize),
        		steps = currentStep - world.step;

        	for (var i = 0; i < steps; i++) world = stepWorld(world);

			if (world.step % 100 == 0) console.dir(worldBuffer);

        	simulator.world = world;
        	return world;
        };

        var runSimulationToNow = function() {
            var now = new Date().getTime(),
                currentStep = Math.floor((now - world.start) / stepSize);

            _.each(world.players, function(player) {
            	runPlayerToNow(player, now, currentStep);
            });

            world.step = currentStep;


        };

        var runPlayerToNow = function(player, now, currentStep) {
        	var now = now || new Date().getTime(),
        		currentStep = currentStep || Math.floor((now - world.start) / stepSize),
        		steps = currentStep - player.step;

        	var oldPosition = vec3.clone(player.position);
        	for (var i = 0; i < steps; i++) {
        		processPlayerStep(player);
        	}
        	//console.log(steps, oldPosition, player.position);
        };

        var runSimulationToStep = function(step) {
          	runSteps(step - world.step);  
        };

        var runSteps = function(steps) {
			for (var i = 0; i <= steps; i++) {
                processStep();
            }
        };

        var runNextStep = function() {
        	runSteps(1);
        };

        var getNextWorld = function(oldWorld) {
			var step = oldWorld.step + 1,
				index = step % 100,
				world = worldBuffer[index];
				

			if (typeof world === 'undefined') {
				var cloneWorld = function(w) {
					if (w == null) return null;
					if (_.isObject(w)) {
						var c = {};
						for (var key in w) {
							c[key] = cloneWorld(w[key]);
						}
						return c;
					}
					if (_.isArray(w)) return _.map(w, cloneWorld);
					return w;
				};
				world = cloneWorld(oldWorld);
				worldBuffer[index] = world;
			}

			world.step = step;

			return world;
		};

        return _.extend(simulator, {
            world: world,
            addPlayer: addPlayer,
            removePlayer: removePlayer,
            startSimulation: startSimulation,
            runWorldToNow: runWorldToNow,
            runSimulationToNow: runSimulationToNow,
            runNextStep: runNextStep
        });
    };
})();

var exports = exports || {};
exports.simulator = faceraceSimulator;