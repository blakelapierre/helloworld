var facerace = facerace || {},
	exports = exports || {};

if (typeof require === 'function' || window.require) {
	_ = require('underscore');
	vec3 = require('../js/lib/gl-matrix-min.js').vec3;
}

(function() {
	var createState = function() {
		return {
			step: 0,
			effects: [],
			vehicle: {
				name: 'cloud',
				speed: 200,
				boostSpeed: 250,
				turnSpeed: Math.PI
			},
			metrics: {
				position: 		[0, 0, 0],
				velocity: 		[0, 0, 0],
				acceleration: 	[0, 0, 0],
				orientation:	[-90, 0, 0], // should we use radians? (yes)
				directionVector:[0, 1, 0],
				direction:		0,
			}
		};
	};

	var createMeta = function(options) {
		return {
			name: options.name,
			face: options.face,
			latency: 0
		};
	};

	var applyStateUpdate = function(state, update) {
		var s = state,
			u = update;

		if (s.step != u.step) throw "applying invalid update!";

		s.effects = u.effects;

		applyVehicleUpdate(state.vehicle, u.vehicle);
		applyMetricsUpdate(state.metrics, u.metrics);
	};

	var applyMetricsUpdate = function(metrics, update) {
		var m = metrics,
			u = update;

		vec3.copy(m.acceleration, u.acceleration);
		vec3.copy(m.velocity, u.velocity);
		vec3.copy(m.position, u.position);
		vec3.copy(m.orientation, u.orientation);
		vec3.copy(m.directionVector, u.directionVector);

		m.direction = u.direction;
	};

	exports.Player = function(world, options) {
		var player = {},
			state = createState(),
			meta = createMeta(),
			predictedState = null,
			controlsHistory = [],
			stateUpdates = [],
			lastReceivedControlsStep = 0;

		options = options || {};

		var id = options.id,
			isServer = !!options.isServer,
			predict = !!options.predict;

		if (predict) predictedState = createState();


		var step = function(world) {
			var worldStep = world.state.step,
				predictStep = world.state.predictStep,
				stateUpdated = false;

			while (state.step < worldStep && state.step < lastReceivedControlsStep) {
				var nextStep = state.step + 1,
					controls = getControlsAtStep(nextStep);

				if (!isServer) {
					var stateUpdate = stateUpdates[nextStep]

					if (stateUpdate) {
						applyStateUpdate(stateUpdate, state);
						delete stateUpdates[nextStep];
					}
				}

				updateState(state, controls);

				if (nextStep > 1) delete controlsHistory[nextStep - 1]
				stateUpdated = true;
			}

			if (predict) {
				if (stateUpdated) resetPredictedState();

				while (predictedState.step < predictStep) {
					var nextStep = predictedState.step + 1,
						controls = getControlsAtStep(nextStep);

					updateState(predictedState, controls);
				}
			}
		};

		var updateState = (function() {
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

			return function(state, controls) {
				var vehicle = state.vehicle,
					metrics = state.metrics,
					
					vehicleAcceleration = vehicle.speed,
					boostAcceleration = vehicle.boostSpeed,
					turnSpeed = vehicle.turnSpeed;
				
				state.step++;

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
				vec3.scale(velocity, velocity, (1 - dt) * (1 - world.state.course.friction));

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
		})();

		var resetPredictedState = function() {
			var s = state,
				p = predictedState,
				sm = s.metrics,
				pm = p.metrics;

			p.step = s.step;
			applyMetricsUpdate(pm, sm);
		};

		var getControlsAtStep = function(step) {
			if (step > lastReceivedControlsStep) return controlsHistory[lastReceivedControlsStep];
			return controlsHistory[step];
		};

		var setControlsAtStep = function(controls, step) {
			controlsHistory[step] = controls;
		};

		var setStateAtStep = function(state, step) {
			stateUpdates[step] = state;
		};

		var loadFrom = function(config) {
			state = config.state;
			meta = config.meta;
			if (predict) resetPredictedState();
		};

		_.extend(player, {
			id: id,
			state: state,
			meta: meta,
			predictedState: predictedState,
			setControlsAtStep: setControlsAtStep,
			setStateAtStep: setStateAtStep
		});
	};

	facerace.Player = exports.Player;
})();