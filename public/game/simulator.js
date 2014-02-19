var facerace = facerace || {};
if (typeof require === 'function' || window.require) {
	_ = require('underscore');
	vec3 = require('../js/lib/gl-matrix-min.js').vec3;
	facerace.Player = require('../game/player.js').Player;
	facerace.World = require('../game/world.js').World;
};

var faceraceSimulator = (function() {
	return function(stepSize) {
		var dt = stepSize / 1000,
			nextWorldID = 0;

		var simulator = {
			nextWorldID: 0,
			stepSize: stepSize,
			dt: dt
		};

		var World = facerace.World(simulator);
			w = World.createWorld(),
			worldControls = w.controls,
			world = w.data,
			
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

		var setPlayerControls = function(player, controls) {
			var now = now || new Date().getTime(),
				currentStep = currentStep || Math.floor((now - world.start) / stepSize);

			setPlayerControlsAtStep(player, controls, currentStep);
		};

		var setPlayerControlsAtStep = function(player, controls, step) {
			_.extend(player.controls, controls, {step: step});
		};


		var runWorldToNow = function() {
			var now = now || new Date().getTime(),
				currentStep = currentStep || Math.floor((now - world.start) / stepSize),
				steps = currentStep - world.step;

			for (var i = 0; i < steps; i++) worldControls.stepWorld();
		};

		return {
			world: world,
			addPlayer: worldControls.addPlayer,
			removePlayer: removePlayer,
			getPlayer: getPlayer,
			setPlayerControls: setPlayerControls,
			setPlayerControlsAtStep: setPlayerControlsAtStep,
			runWorldToNow: runWorldToNow,
			updateLastControls: worldControls.updateLastControls
		};
	};
})();

var exports = exports || {};
exports.simulator = faceraceSimulator;