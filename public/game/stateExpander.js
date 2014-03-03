var simulator = require('simulator');

exports.stateExpander = function() {
	
	var getAllStates = function(world, events) {
		var states = [];

		while(true) {
			worldControls.stepWorld();
			states.push(worldControls.getState());
		}
	}

};