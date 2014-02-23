
var facerace = facerace || {};
facerace.Player = function(world, options) {
	var getNextPlayerID = function() {
		return world.info.nextPlayerID++;
	};

	var addPlayer = function() {
		var player = arguments[0];
		if (typeof player !== 'object') {
			var name = player || 'NO NAME!',
				image = arguments[1] || '/images/faces/default.png';

			player = {
				name: name,
				state: {
					step: 0,
					effects: [],
					vehicle: {
						name: 'cloud',
						speed: 200,
						boostSpeed: 250,
						turnSpeed: Math.PI
					},
					controls: {
						step: 0,
						turn: 0,
						up: false,
						down: false,
					},
					metrics: {
						position: 		vec3.clone(world.course.startPosition),
						velocity: 		[0, 0, 0],
						acceleration: 	[0, 0, 0],
						orientation:	[-90, 0, 0],
						directionVector:[0, 1, 0],
						direction:		0,
					}
				},
				controlsHistory: {'0':{turn: 0}},
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

		if (!!options.isClient) {
			player.prediction = JSON.parse(JSON.stringify(player.state));
		}

		player.id = getNextPlayerID();
		world.playerMap[player.id] = world.players.length;
		world.players.push(player);

		return player;
	};

	var dt = world.dt,
		stepSize = world.stepSize;

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

		var updateState = function(state, player) {
			var controls = state.controls,
				vehicle = state.vehicle,
				metrics = state.metrics,
				
				vehicleAcceleration = vehicle.speed,
				boostAcceleration = vehicle.boostSpeed,
				turnSpeed = vehicle.turnSpeed;
			
			state.step++;

			state.controls = controls = getCurrentControls(player);

			stepTurn = 0;
			turn = controls.turn;
			direction = metrics.direction;
			
			vec3.copy(velocity, metrics.velocity);
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

			vec3.add(metrics.position, metrics.position, stepVelocity);

			if (speed > 0) vec3.normalize(previousDirection, metrics.velocity);
			else previousDirection = directionVector;

			vec3.copy(metrics.directionVector, directionVector);
			vec3.copy(metrics.acceleration, acceleration);
			vec3.copy(metrics.velocity, velocity);

			metrics.direction = direction;
			metrics.speed = speed;

			metrics.orientation[1] = metrics.direction / Math.PI * 180;
		};

		if (!!options.isClient) {
			return function(player) {
				var step = world.step;

				while (player.state.step < step) {
					updateState(player.state, player);
				}
			};
		}
		else {
			return function(player) {
				var step = world.step;

				while (player.state.step < step) {
					updateState(player.state, player);
				};	
			};
		}
	})();

	var getCurrentControls = function(player) {
		var step = player.state.step,
			controls = player.controlsHistory[step];

		if (controls == null) {
			controls = player.controlsHistory[step - 1];
			player.controlsHistory[step] = controls;
		}

		if (step > 0) delete player.controlsHistory[step - 1];

		return controls;
	};

	var updateLastControls = function(player) {
		var last = player.lastControlsUpdate,
			state = player.state,
			controls = state.controls,
			metrics = state.metrics;

		last.step = player.state.step;
		vec3.copy(last.acceleration, metrics.acceleration);
		vec3.copy(last.velocity, metrics.velocity);
		vec3.copy(last.position, metrics.position);
		vec3.copy(last.orientation, metrics.orientation);
		vec3.copy(last.directionVector, metrics.directionVector);

		last.direction = metrics.direction;

		_.extend(last.controls, controls);
	};

	var resetPlayer = function(player) {
		var last = player.lastControlsUpdate,
			state = player.state,
			controls = state.controls,
			metrics = state.metrics;
		
		player.state.step = last.step;

		vec3.copy(metrics.acceleration, last.acceleration);
		vec3.copy(metrics.velocity, last.velocity);
		vec3.copy(metrics.position, last.position);
		vec3.copy(metrics.orientation, last.orientation);
		vec3.copy(metrics.directionVector, last.directionVector);

		metrics.direction = last.direction;
	};

	var setPlayerControls = function(player, controls) {
		var now = now || new Date().getTime(),
			currentStep = currentStep || Math.floor((now - world.start) / stepSize);

		setPlayerControlsAtStep(player, controls, currentStep);
	};

	var setControlsAtStep = function(player, controls, step) {
		player.controlsHistory[step] = _.clone(controls);
	};

	var getPlayer = function(id) {
		var index = world.playerMap[id];
		return world.players[index];
	};

	var startRace = function(player, i) {
		var metrics = player.state.metrics,
			startPosition = world.course.startPosition;

		vec3.set(metrics.position, startPosition[0], startPosition[1] + 10 * i, startPosition[2]);
		vec3.set(metrics.acceleration, 0, 0, 0);
		vec3.set(metrics.velocity, 0, 0, 0);
	};

	return {
		getPlayer: getPlayer,
		addPlayer: addPlayer,
		updatePlayer: updatePlayer,
		setControlsAtStep: setControlsAtStep,
		updateLastControls: updateLastControls,
		startRace: startRace
	};
};

var exports = exports || {};
exports.Player = facerace.Player;