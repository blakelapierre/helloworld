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
					startPosition: [100, 100, 44]
				},
				stars: [{
					position: [400, 400, 30],
					orientation: [-90, 0, 0],
					scale: 0.2,
					style: {
						'-webkit-transform-origin': '50% 50%'
					}
				},{
					position: [400, 450, 30],
					orientation: [-90, 0, 0],
					scale: 0.2,
					style: {
						'-webkit-transform-origin': '50% 50%'
					}
				}],
				playerMap: {},
				players: players
			};

		for (var i = 0; i < 50; i++) {
			world.stars.push({
				position: [400, 500 + (20 * i), 30],
				orientation: [-90, 0, 0],
				scale: 0.2,
				style: {
					'-webkit-transform-origin': '50% 50%'
				}
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
						orientation: [0, 0, 0],
						calibration: [0, 0, 0]
					},
					vehicle: {
						speed: 5,
						turnSpeed: Math.PI / 8
					},
					face: image,
					style: {
						'-webkit-transform-origin': '0% 0%'
					},
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

			// console.log(player.controls.orientation, player.controls.calibration);
			var orientation = [0,0,0];
			vec3.sub(orientation, player.controls.orientation, player.controls.calibration);
			// console.log(orientation);
			var angle = orientation[0];
			if (angle > 180) angle -= 360;
			player.direction += 0.025 * player.vehicle.turnSpeed * angle * dt;

			// Handle inputs
			if (player.controls.left) {
				player.direction = (player.direction + (player.vehicle.turnSpeed * dt));
			}
			if (player.controls.right) {
				player.direction = (player.direction - (player.vehicle.turnSpeed * dt));
			}

			vec3.set(player.directionVector, Math.sin(player.direction), Math.cos(player.direction), 0);

			

			if (player.controls.up) {
				vec3.scale(acceleration, player.directionVector, player.vehicle.speed * dt);
				vec3.add(acceleration, player.acceleration, acceleration);
			}
			if (player.controls.down) {
				vec3.scale(acceleration, player.directionVector, player.vehicle.speed * dt);
				vec3.sub(acceleration, player.acceleration, acceleration);
			}


	// Velocity = Velocity + Acceleration
	// vec3.set(player.acceleration, acceleration[0], acceleration[1], acceleration[2]);
	// vec3.add(player.velocity, player.velocity, acceleration);


			var accelerationMagnitude = vec3.length(acceleration);
			if (accelerationMagnitude > player.vehicle.speed) accelerationMagnitude = player.vehicle.speed;

			var previousDirection = vec3.create();

			var velocity = player.velocity,
				speed = vec3.length(velocity);

			if (speed > 0) vec3.normalize(previousDirection, velocity);
			else previousDirection = player.directionVector;

			vec3.scale(velocity, player.directionVector, speed);
			vec3.scale(acceleration, previousDirection, accelerationMagnitude);

			// console.log(acceleration[0], acceleration[1], acceleration[2]);
			vec3.add(velocity, velocity, acceleration);


			// var speed = vec3.length(player.velocity);
			// var direction = [];
			// var lateralAcceleration = vec3.clone(acceleration);

			// if (speed > 0) {
			// 	vec3.normalize(direction, player.velocity);
			// }
			// else {
			// 	direction = vec3.clone(player.directionVector);
			// }

			// if (accelerationMagnitude > 0) {
				
			// 	vec3.scale(acceleration, direction, 0.9 * accelerationMagnitude);
				
			// 	vec3.scale(lateralAcceleration, player.directionVector, 0.1 * accelerationMagnitude);

			// 	vec3.add(acceleration, acceleration, lateralAcceleration);

			// 	console.log(acceleration[0], acceleration[1], acceleration[2]);
			// }


			// Velocity = Velocity + Acceleration
			vec3.set(player.acceleration, acceleration[0], acceleration[1], acceleration[2]);

			// vec3.add(player.velocity, player.velocity, acceleration);
			//if (vec3.length(player.acceleration) > 0) console.log(player.acceleration, vec3.length(player.acceleration));

			var stepVelocity = vec3.create();
			vec3.scale(stepVelocity, player.velocity, dt);
			vec3.add(player.position, player.position, stepVelocity);

			player.orientation[1] = player.direction / Math.PI * 180;
			
			// var angle = player.controls.orientation[0];
			// if (angle > 180) angle -= 360;
			// player.orientation[2] = angle;
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