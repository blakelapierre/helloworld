var facerace = facerace || {};
if (typeof require === 'function' || window.require) {
	_ = require('underscore');
	vec3 = require('../js/lib/gl-matrix-min.js').vec3;
	facerace.Player = require('../game/player.js').Player;
};

facerace.World = function(simulator) {
	var getNextWorldID = function() {
		return simulator.nextWorldID++;
	};

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
		var world = {
			id: getNextWorldID(),
			info: {
				nextPlayerID: 0
			},
			step: 0,
			stepSize: simulator.stepSize,
			dt: simulator.dt,
			start: new Date().getTime(),
			course: getCourse(1),
			playerMap: {},
			players: [],
			friction: 0.01
		};

		var Player = facerace.Player(world);

		var stepWorld = function() {
			world.step++;
			_.each(world.players, function(player, i) { Player.updatePlayer(world.step, player, i); });
		};

		var removePlayer = function(id) {
			var index = world.playerMap[id];
			if (index != null) {
				world.players.splice(index, 1);
				delete world.playerMap[id];
			}
		};

		var setPlayerControlsAtStep = function(id, controls, step) {
			var player = Player.getPlayer(id);
			Player.setControlsAtStep(player, controls, step);
		};

		return {
			data: world,
			controls: {
				addPlayer: Player.addPlayer,
				removePlayer: removePlayer,
				updateLastControls: Player.updateLastControls,
				stepWorld: stepWorld,
				setPlayerControlsAtStep: setPlayerControlsAtStep
			}
		};
	};

	return {
		createWorld: createWorld
	};
};

var exports = exports || {};
exports.World = facerace.World;
