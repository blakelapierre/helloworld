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
	                    startPosition: [10, 500, 11],
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

        var updatePlayer = (function() {
        	var acceleration = vec3.create(),
        		stepAcceleration = vec3.create(),
        		velocity = vec3.create(),
        		position = vec3.create(),
        		stepVelocity = vec3.create(),
        		directionVector = vec3.create(),
        		previousDirection = vec3.create(),
        		vehicleSpeed = 0,
        		speed = 0,
        		direction = 0,
        		turn = 0;

	        return function(step, player, index) {
	        	var controls = player.controls,
	        		last = player.lastControlsUpdate;
	        		vehicleAcceleration = player.vehicle.speed,
		            boostAcceleration = player.vehicle.boostSpeed,
		            turnSpeed = player.vehicle.turnSpeed;

	        	// we have new controls, re-calc from last control update
	        	if (controls.step > last.step) {
	        		console.log(controls.step, last.step);
	        		resetPlayer(player);
	        	}

	        	if (step - last.step > (1000 / stepSize)) {
	        		// do something if the control info is older than 1 second
	        	}

				// calculate current (world.step) position, velocity, acceleration, etc.
	        	while (player.step < step) {
	        		player.step++;

	        		vec3.copy(velocity, player.velocity);
	        		vec3.set(acceleration, 0, 0, 0);

		            turn = 0;
		            angle = controls.turn;
		            direction = player.direction;

		            if (angle > 180) angle -= 360;
		            turn += 0.025 * turnSpeed * angle;
		            turn *= dt;

		            direction += turn;

		            vec3.set(directionVector, Math.sin(direction), Math.cos(direction), 0);

		            if (controls.space) vehicleAcceleration += boostAcceleration;

		            if (controls.up) vec3.scale(acceleration, directionVector, vehicleAcceleration);
		            if (controls.down) vec3.scale(acceleration, directionVector, -vehicleAcceleration);
					
					speed = vec3.length(velocity);		            
		            // NEED TO NOT JUST CHANGE VELOCITY ALONG NEW DIRECTION

		            vec3.scale(velocity, directionVector, speed);
					
					vec3.scale(stepAcceleration, acceleration, dt);
		            vec3.add(velocity, velocity, stepAcceleration);

		            // Apply friction
		            vec3.scale(velocity, velocity, (1 - dt) * (1 - world.friction));

		            // If we get too slow, we just stop
		            speed = vec3.length(velocity);
		            var accelerationMagnitude = vec3.length(acceleration);
		            
		            if (accelerationMagnitude == 0 && speed < 0.5) {
		            	vec3.set(velocity, 0, 0, 0);
		            	speed = 0;
		            }

		            vec3.scale(stepVelocity, velocity, dt);

		            vec3.add(player.position, player.position, stepVelocity);

		            if (speed > 0) vec3.normalize(previousDirection, player.velocity);
		            else previousDirection = directionVector;

		            vec3.sub(player.lastTurn, directionVector, previousDirection);
		            vec3.set(player.lastTurn, Math.sin(turn), Math.cos(turn), 0);

		            vec3.copy(player.directionVector, directionVector);
		            vec3.copy(player.acceleration, acceleration);
		            vec3.copy(player.velocity, velocity);

		            player.direction = direction;

		            player.orientation[1] = player.direction / Math.PI * 180;

		            if (player.step == controls.step) updateLastControls(player);
	        	}
	        };
	    })();

        var resetPlayer = function(player) {
        	console.log('resetting', player.id);
        	var last = player.lastControlsUpdate;
        	
        	player.step = last.step;

        	vec3.copy(player.acceleration, last.acceleration);
        	vec3.copy(player.velocity, last.velocity);
        	vec3.copy(player.position, last.position);
        	vec3.copy(player.orientation, last.orientation);
        	vec3.copy(player.directionVector, last.directionVector);

        	player.direction = last.direction;
        }

        var updateLastControls = function(player, step) {
        	var last = player.lastControlsUpdate;

        	last.step = step;
        	vec3.copy(last.acceleration, player.acceleration);
        	vec3.copy(last.velocity, player.velocity);
        	vec3.copy(last.position, player.position);
        	vec3.copy(last.orientation, player.orientation);
        	vec3.copy(last.directionVector, player.directionVector);

        	last.direction = player.direction;
        };

        var addPlayer = function() {
            var player = arguments[0];
            if (typeof player !== 'object') {
                var name = player || 'NO NAME!',
                    image = arguments[1] || '/images/faces/default.png';

				player = {
					step: 0,
					name: name,
					orientation: [-90, 0, 0],
					position: vec3.clone(world.course.startPosition),
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
						turn: 0
					},
					vehicle: {
						speed: 300,
						boostSpeed: 500,
						turnSpeed: Math.PI / 2
					},
					face: image,
					scale: 2,
					pingStart: 0,
					latency: 0,
					lastControlsUpdate: {
						step: 0,
						acceleration: vec3.create(),
						velocity: vec3.create(),
						position: vec3.create(),
						orientation: vec3.create(),
						direction: 0,
						directionVector: vec3.create()
					}
				};

				updateLastControls(player, 0);
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


	    var setPlayerControls = function(player, controls) {
	    	var now = now || new Date().getTime(),
        		currentStep = currentStep || Math.floor((now - world.start) / stepSize);

        	_.extend(player.controls, controls, {step: currentStep});
	    };

        var startSimulation = function() {
            world.step = 0;
            world.start = new Date().getTime();

            var startPosition = world.course.startPosition;
            _.each(world.players, function(player) {
                vec3.copy(player.position, startPosition);
            });
        };

        var stepWorld = function() {
        	world.step++;
        	for (var i = 0; i < world.players.length; i++) {
        		updatePlayer(world.step, world.players[i], i);
        	}
        };

        var runWorldToNow = function() {
        	var now = now || new Date().getTime(),
        		currentStep = currentStep || Math.floor((now - world.start) / stepSize),
        		steps = currentStep - world.step;

        	for (var i = 0; i < steps; i++) stepWorld(world);
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
            setPlayerControls: setPlayerControls,
            startSimulation: startSimulation,
            runWorldToNow: runWorldToNow
        });
    };
})();

var exports = exports || {};
exports.simulator = faceraceSimulator;