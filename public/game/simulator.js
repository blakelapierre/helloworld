var facerace = facerace || {};
if (typeof require === 'function' || window.require) {
	_ = require('underscore');
	vec3 = require('../js/lib/gl-matrix-min.js').vec3;
	facerace.Player = require('../game/player.js').Player;
	facerace.World = require('../game/world.js').World;
};

var faceraceSimulator = (function() {
	return function(stepSize, options) {
		options = options || {};
		options.log = options.log || {
			info: function() { console.log.apply(console, arguments); },
			debug: function() {}
		};

		var logStates = options.logStates,
			stateLog = [];

		var dt = stepSize / 1000,
			nextWorldID = 0;

		var simulator = {
			nextWorldID: 0,
			stepSize: stepSize,
			dt: dt,
			isClient: !!options.isClient
		};

		var World = facerace.World(simulator, options);
			w = World.createWorld(),
			worldControls = w.controls,
			world = w.data,
			adminControls = w.admin;

		var setPlayerControls = function(id, controls) {
			var now = new Date().getTime(),
				currentStep = Math.floor((now - world.state.start) / stepSize);

			worldControls.setPlayerControlsAtStep(id, controls, currentStep);
		};

		var runWorldToNow = function() {
			var now = new Date().getTime(),
				currentStep = Math.floor((now - world.state.start) / stepSize);

				

			while (world.state.predictStep < currentStep) {
				worldControls.stepWorld();
				if (logStates) stateLog.push(JSON.stringify(worldControls.getState())); 
			}
		};

		var getStateLog = function() {
			return stateLog;
		};

		return {
			world: world,
			worldControls: worldControls,
			adminControls: adminControls,
			addPlayer: worldControls.addPlayer,
			removePlayer: worldControls.removePlayer,
			getPlayer: worldControls.getPlayer,
			setPlayerControls: setPlayerControls,
			setPlayerControlsAtStep: worldControls.setPlayerControlsAtStep,
			runWorldToNow: runWorldToNow,
			updateLastControls: worldControls.updateLastControls,
			getStateLog: getStateLog
		};
	};
})();

var exports = exports || {};
exports.simulator = faceraceSimulator;