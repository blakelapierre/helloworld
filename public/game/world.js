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
				nextPlayerID: 0,
				receivedEventsForStep: 0,
				lastReceivedEvents: 0
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

		var events = {};

		var Player = facerace.Player(world, options);

		var stepWorld = function() {
			if (isClient && world.step > world.info.lastReceivedEvents) return;

			world.step++;

			processEvents();
			updatePlayers();
		};

		var processEvents = function() {
			_.each(events[world.step] || [], processEvent);
			delete events[world.step];
		};

		var processEvent = function(e) {
			switch (e.type) {
				case 'controls':
					setPlayerControlsAtStep(e.id, e.controls, world.step);
					break;
			}
		};

		var updatePlayers = function() {
			_.each(world.players, Player.updatePlayer);
		};

		var addEvent = function(e, step) {
			var queue = events[step] || [];
			events[step] = queue;
			queue.push(e);
		};

		var setEvents = function(step, es) {
			var queue = events[step] = events[step] || [];
			_.each(es, function(e) { queue.push(e); });
			world.info.receivedEventsForStep = step;
			world.info.lastReceivedEvents = new Date().getTime();
		};

		var getEvents = function(step) {
			step = step || (world.step + 1);
			return {
				step: step,
				events: events[step]
			};
		};

		var getPlayer = function(id) {
			var index = world.playerMap[id];
			return world.players[index];
		};

		var getPlayers = function() {
			return world.players;
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

		var setStateAt = function(state, step) {

		};

		var startRace = function() {
			_.each(world.players, Player.startRace);
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
