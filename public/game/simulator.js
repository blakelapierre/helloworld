var facerace = facerace || {};
if (typeof require === 'function' || window.require) {
	_ = require('underscore');
	vec3 = require('../js/lib/gl-matrix-min.js').vec3;
	facerace.Player = require('../game/player.js').Player;
};

var faceraceSimulator = (function() {
	return function(stepSize) {
		var dt = stepSize / 1000,
			nextWorldID = 0;

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
				stepSize: stepSize,
				dt: dt,
				start: new Date().getTime(),
				course: getCourse(1),
				playerMap: {},
				players: [],
				friction: 0.01
			};
		};

		var world = createWorld(),
			Player = facerace.Player(world),
			players = world.players,
			playerMap = world.playerMap;
		

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
				Player.updatePlayer(world.step, world.players[i], i);
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
			addPlayer: Player.addPlayer,
			removePlayer: removePlayer,
			getPlayer: getPlayer,
			setPlayerControls: setPlayerControls,
			setPlayerControlsAtStep: setPlayerControlsAtStep,
			startSimulation: startSimulation,
			runWorldToNow: runWorldToNow,
			updateLastControls: Player.updateLastControls
		};
	};
})();

var exports = exports || {};
exports.simulator = faceraceSimulator;