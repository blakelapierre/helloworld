if (typeof require === 'function' || window.require) {
	_ = require('underscore');
	vec3 = require('../js/lib/gl-matrix-min.js').vec3;
};

var faceraceSimulator = (function() {
	return function(stepSize) {
		var dt = stepSize / 1000,
			nextWorldID = 0,
			nextPlayerID = 0;

		var getCourse = function(id) {
			var course = {
				image: '/images/course.png',
				size: [2400, 2400],
				startPosition: [10, 500, 11],
				stars: []
			};

			for (var i = 0; i < 50; i++) {
				course.stars.push({
					position: [400, 500 + (20 * i), 30],
					orientation: [-90, 0, 0]
				});
			}

			return course;
		};

		var createWorld = function() {
			return {
				id: nextWorldID++,
				step: 0,
				start: new Date().getTime(),
				course: getCourse(1),
				playerMap: {},
				players: [],
				friction: 0.01
			};
		};

		var world = createWorld(),
			players = world.players,
			playerMap = world.playerMap;


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
				stepTurn = 0;

			return function(step, player) {
				var controls = player.controls,
					last = player.lastControlsUpdate;
					vehicleAcceleration = player.vehicle.speed,
					boostAcceleration = player.vehicle.boostSpeed,
					turnSpeed = player.vehicle.turnSpeed;

				// we have new controls, re-calc from last control update
				if (controls.step > last.step + 1) {
					resetPlayer(player);
				}

				if (step - last.step > (1000 / stepSize)) {
					// do something if the control info is older than 1 second
				}

				// calculate current (world.step) position, velocity, acceleration, etc.
				while (player.step < step) {
					player.step++;

					stepTurn = 0;
					turn = controls.turn * Math.PI / 180;
					direction = player.direction;
					vec3.copy(velocity, player.velocity);
					vec3.set(acceleration, 0, 0, 0);					

					speed = vec3.length(velocity);

					if (turn > Math.PI) turn -= 2 * Math.PI;
					stepTurn += turn * turnSpeed;
					stepTurn *= dt;

					direction += stepTurn;
					vec3.set(directionVector, Math.sin(direction), Math.cos(direction), 0);
					vec3.normalize(directionVector, directionVector);

					var acc = 0;
					if (controls.space) acc += boostAcceleration;
					if (controls.up) acc += vehicleAcceleration;
					if (controls.down) acc = -vehicleAcceleration;
					
					// acceleration -> velocity -> position
					vec3.scale(acceleration, directionVector, acc);
					vec3.scale(stepAcceleration, acceleration, dt);
					vec3.add(velocity, velocity, stepAcceleration);

					speed = vec3.length(velocity);
					
					//vec3.scale(velocity, velocity, (1 - (speed / acc)));

					// speed = vec3.length(velocity);
					// // NEED TO NOT JUST CHANGE VELOCITY ALONG NEW DIRECTION
					// vec3.scale(velocity, directionVector, speed);

					// vec3.scale(acceleration, directionVector, acc);
					// vec3.scale(stepAcceleration, acceleration, dt);
					// vec3.add(velocity, velocity, stepAcceleration);

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

					vec3.copy(player.directionVector, directionVector);
					vec3.copy(player.acceleration, acceleration);
					vec3.copy(player.velocity, velocity);

					player.direction = direction;
					player.speed = speed;

					player.orientation[1] = player.direction / Math.PI * 180;

					if (player.step == controls.step) updateLastControls(player);
				}
			};
		})();

		var resetPlayer = function(player) {
			var last = player.lastControlsUpdate;
			
			player.step = last.step;

			vec3.copy(player.acceleration, last.acceleration);
			vec3.copy(player.velocity, last.velocity);
			vec3.copy(player.position, last.position);
			vec3.copy(player.orientation, last.orientation);
			vec3.copy(player.directionVector, last.directionVector);

			player.direction = last.direction;
		}

		var updateLastControls = function(player) {
			var last = player.lastControlsUpdate;

			last.step = player.step;
			vec3.copy(last.acceleration, player.acceleration);
			vec3.copy(last.velocity, player.velocity);
			vec3.copy(last.position, player.position);
			vec3.copy(last.orientation, player.orientation);
			vec3.copy(last.directionVector, player.directionVector);

			last.direction = player.direction;

			_.extend(last.controls, player.controls);
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
					controls: {
						step: 0,
						left: false,
						up: false,
						right: false,
						down: false,
						space: false
					},
					vehicle: {
						speed: 200,
						boostSpeed: 250,
						turnSpeed: Math.PI / 4
					},
					face: image,
					scale: 4,
					pingStart: 0,
					latency: 0,
					lastControlsUpdate: {
						step: 0,
						acceleration: vec3.create(0, 0, 0),
						velocity: vec3.create(0, 0, 0),
						position: vec3.create(0, 0, 0),
						orientation: vec3.create(0, 0, 0),
						direction: 0,
						directionVector: vec3.create(0, 0, 0),
						controls: {
							step: 0,
							left: false,
							up: false,
							right: false,
							down: false,
							space: false,
							turn: 0
						}
					}
				};

				updateLastControls(player);
			}

			player.id = nextPlayerID++;
			world.playerMap[player.id] = world.players.length;
			world.players.push(player);

			return player;
		};

		var insertPlayer = function(player) {
			nextPlayerID = player.id + 1;

			world.playerMap[player.id] = world.players.length;
			world.players.push(player);
		};

		var removePlayer = function(player) {
			var id = player.id,
				index = world.playerMap[id];
			world.players.splice(index, 1);
			delete world.playerMap[id];
		};

		var getPlayer = function(id) {
			return world.players[world.playerMap[id]];
		};

		var processStep = function() {
			_.each(players, processPlayerStep);
			world.step++;
		};


		var setPlayerControls = function(player, controls) {
			var now = now || new Date().getTime(),
				currentStep = currentStep || Math.floor((now - world.start) / stepSize);

			setPlayerControlsAtStep(player, controls, currentStep);
		};

		var setPlayerControlsAtStep = function(player, controls, step) {
			_.extend(player.controls, controls, {step: step});
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

		return {
			world: world,
			addPlayer: addPlayer,
			insertPlayer: insertPlayer,
			removePlayer: removePlayer,
			getPlayer: getPlayer,
			setPlayerControls: setPlayerControls,
			setPlayerControlsAtStep: setPlayerControlsAtStep,
			startSimulation: startSimulation,
			runWorldToNow: runWorldToNow,
			updateLastControls: updateLastControls
		};
	};
})();

var exports = exports || {};
exports.simulator = faceraceSimulator;