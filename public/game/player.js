
var facerace = facerace || {};
facerace.Player = function(world) {
	var getNextPlayerID = function() {
		return world.info.nextPlayerID++;
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
				controlsHistory: {'0':{turn: 0}},
				vehicle: {
					speed: 200,
					boostSpeed: 250,
					turnSpeed: Math.PI
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

		return function(step, player) {
			var controls = player.controls,
				last = player.lastControlsUpdate;
				vehicleAcceleration = player.vehicle.speed,
				boostAcceleration = player.vehicle.boostSpeed,
				turnSpeed = player.vehicle.turnSpeed;

			// we have new controls, re-calc from last control update
			if (controls.step > last.step + 1) {
				//resetPlayer(player);
			}

			if (step - last.step > (1000 / stepSize)) {
				// do something if the control info is older than 1 second
			}

			// calculate current (world.step) position, velocity, acceleration, etc.
			while (player.step < step) {
				player.step++;

				controls = getCurrentControls(player);
				vec3.copy(player.controls, controls);

				stepTurn = 0;
				turn = controls.turn;
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

				//if (player.step == controls.step) updateLastControls(player);
			}
		};
	})();

	var getCurrentControls = function(player) {
		var step = player.step,
			controls = player.controlsHistory[step];

		if (controls == null) {
			controls = player.controlsHistory[step - 1];
			player.controlsHistory[step] = controls;
		}

		if (step > 0) delete player.controlsHistory[step - 1];

		return controls;
	};

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

	var resetPlayer = function(player) {
		var last = player.lastControlsUpdate;
		
		player.step = last.step;

		vec3.copy(player.acceleration, last.acceleration);
		vec3.copy(player.velocity, last.velocity);
		vec3.copy(player.position, last.position);
		vec3.copy(player.orientation, last.orientation);
		vec3.copy(player.directionVector, last.directionVector);

		player.direction = last.direction;
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

	return {
		getPlayer: getPlayer,
		addPlayer: addPlayer,
		updatePlayer: updatePlayer,
		setControlsAtStep: setControlsAtStep,
		updateLastControls: updateLastControls
	};
};

var exports = exports || {};
exports.Player = facerace.Player;