var facerace = facerace || {},
	exports = exports || {};

if (typeof require === 'function' || window.require) {
	_ = require('underscore');
	vec3 = require('../js/lib/gl-matrix-min.js').vec3;
	facerace.Player = require('../game/player.js').Player;
}

(function() {
	var createState = function(options) {

		return {
			step: 0,
			predictStep: 0,
			start: options.start || new Date().getTime(),
			nextPlayerID: 0,
			receivedEventsForStep: 0,
			lastReceivedEvents: 0,
			course: getCourse(1),
			playerMap: {},
			players: []
		};
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

	exports.World = function(options) {
		options = options || {};

		var world = {},
			id = options.id,
			state = createState(options),
			players = [],
			playerMap = {},
			inMQ = [],
			outMQ = [];

		var predict = !!options.predict,
			isClient = !!options.isClient;

		var step = function(world) {
			world.state.step++;

			processMessages();
			updatePlayers();

			if (predict) predictPlayers();
		};

		var processMessages = (function() {
			var withCallback = function(fn) {
				return function(message) {
					var callback = message.callback;

					var ret = fn(message);

					if (callback) {
						outMQ.push({
							type: 'callback',
							callback: function() { callback(world, ret); }
						});
					}
				};
			};

			var handlers = {
				addPlayer: withCallback(function(message) {
					var config = message.config;
					
					var player = facerace.Player(world, {
						id: state.nextPlayerID++,
						name: config.name,
						face: config.face,
						isServer: isServer,
						predict: predict
					});

					return player;
				}),
				controls: function(message) {
					var player = playerMap[message.playerID];
					player.setControlsAtStep(message.controls, message.step);
					return true;
				},
				stateUpdate: function(update) {
					var player = playerMap[message.playerID];
					player.setStateAtStep(message.state, message.step);
					return true;
				}
			};

			return function(step) {
				_.each(inMQ, function(message) {
					handlers[message.type](message, step);
				});
			};
		})();

		var updatePlayers = function() {
			_.each(players, function(player) {
				player.step();
			});
		};

		var predictPlayers = function() {
			_.each(players, function(player) {
				player.predict();
			});
		};

		var writeMessages = function(messages) {
			if (messages.length == 0) return;
			if (outMQ.length == 0) outMQ = messages;
			else outMQ = outMQ.concat(messages);
		};

		var readMessages = function() {
			var out = outMQ;
			outMQ = [];
			return out;
		};

		var msg = function(message) {
			outMQ.push(message);
		};

		var getWorldState = function() {
			return {
				step: state.step,
				predictStep: state.predictStep,
				start: state.start,
				course: getCourse(1),
				playerMap: _.map(state.players, function(player) {
					return player.id;
				}),
				players: _.map(state.players, function(player) {
					return {
						state: player.state,
						meta: player.meta
					};
				})
			};
		};

		var loadFrom = function(config) {
			state.step = config.step;
			state.predictStep = config.step;
			state.start = config.start;
			state.course = config.course;

			state.players = _.map(config.players, function(playerConfig) {
				var player = facerace.Player({
					id: playerConfig.id,
					name: playerConfig.meta.name,
					face: playerConfig.meta.face,
					isServer: isServer,
					predict: predict
				});
				player.loadFrom(playerConfig);
				return player;
			});

			state.playerMap = {}; // should we be creating a new map here?
			_.each(state.players, function(player) {
				state.playerMap[player.id] = player;
			});
		};

		_.extend(world, {
			step: step,
			state: state,
			writeMessages: writeMessages,
			readMessages: readMessages,
			getWorldState: getWorldState,
			loadFrom: loadFrom
		});
		return world;
	};

	facerace.World = exports.World;
})();