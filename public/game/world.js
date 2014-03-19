var facerace = facerace || {};
if (typeof require === 'function' || window.require) {
	_ = require('underscore');
	vec3 = require('../js/lib/gl-matrix-min.js').vec3;
	facerace.Player = require('../game/player.js').Player;
};

facerace.World = function(simulator, options) {
	var isClient = simulator.isClient;

	var getNextWorldID = function() {
		return simulator.nextWorldID++;
	};

	var getCourse = function(id) {
		var course = {
			image: '/images/course.png',
			size: [2400, 2400],
			startPosition: [10, 500, 11],
			stars: [],
			friction: 0.01
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
			state: {
				step: 0,
				predictStep: 0,
				start: new Date().getTime(),
				nextPlayerID: 0,
				receivedEventsForStep: 0,
				lastReceivedEvents: 0,
				course: getCourse(1),
				playerMap: {},
				players: []
			},
			info: {
				options: options,
				stepSize: simulator.stepSize,
				dt: simulator.dt
			}
		};

		var events = {};

		var Player = facerace.Player(world, options);

		var stepWorld = function() {
			if (!(isClient && world.state.step > world.state.receivedEventsForStep)) {
				world.state.step++;
				
				processEvents();
				updatePlayers(); 	
			}

			world.state.predictStep++;
			
			if (isClient) predictPlayers();
		};

		var processEvents = function() {
			_.each(events[world.state.step] || [], processEvent);
			delete events[world.state.step - 1];
		};

		var processEvent = function(e) {
			switch (e.type) {
				case 'controls':
					setPlayerControlsAtStep(e.id, e.controls, e.controls.step);
					break;
			}
		};

		var updatePlayers = function() {
			_.each(world.state.players, Player.updatePlayer);
		};

		var predictPlayers = function() {
			_.each(world.state.players, Player.predictPlayer);
		};

		var addEvent = function(step, e) {
			var queue = events[step] || [];
			events[step] = queue;
			queue.push(e);
		};

		var setEvents = function(step, es) {
			var queue = events[step] = events[step] || [];
			_.each(es, function(e) { queue.push(e); });
			world.state.receivedEventsForStep = step;
			world.state.lastReceivedEvents = new Date().getTime();
		};

		var getEvents = function(step) {
			step = step || (world.state.step + 1);
			return {
				step: step,
				events: events[step]
			};
		};

		var getPlayer = function(id) {
			var index = world.state.playerMap[id];
			return world.state.players[index];
		};

		var getPlayers = function() {
			return world.state.players;
		};

		var removePlayer = function(id) {
			var index = world.state.playerMap[id];
			if (index != null) {
				world.state.players.splice(index, 1);
				delete world.state.playerMap[id];
			}
		};

		var setPlayerControlsAtStep = function(id, controls, step) {
			var player = Player.getPlayer(id);
			Player.setControlsAtStep(player, controls, step);
		};

		var setStateAt = function(state, step) {

		};

		var startRace = function() {
			_.each(world.state.players, Player.startRace);
		};

		return {
			data: world,
			controls: {
				addPlayer: Player.addPlayer,
				getPlayer: getPlayer,
				getPlayers: getPlayers,
				removePlayer: removePlayer,
				addEvent: addEvent,
				setEvents: setEvents,
				getEvents: getEvents,
				updateLastControls: Player.updateLastControls,
				stepWorld: stepWorld,
				setPlayerControlsAtStep: setPlayerControlsAtStep,
				setStateAt: setStateAt
			},
			admin: {
				startRace: startRace
			}
		};
	};

	return {
		createWorld: createWorld
	};
};

var exports = exports || {};
exports.World = facerace.World;
