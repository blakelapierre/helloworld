var facerace = facerace || {},
    exports = exports || {};
if (typeof require === 'function' || window.require) {
    _ = require('underscore');
    facerace.World = require('../game/world.js').World;
}


(function() {

    exports.Simulator = function(options) {
        options = options || {};

        options.stepSize = options.stepSize || 20;

        var simulator = {},
            world = options.world || facerace.World(options.worldConfig),
            inMQ = [],
            messageHandler = options.messageHandler || function(msg) {
                console.log('world msg:', msg);
            };


        var stepWorldToNow = function(now) {
            now = now || new Date().getTime();

            var currentStep = Math.floor((now - world.state.start) / options.stepSize);

            world.writeMessages(inMQ);
            while (currentStep < world.state.step) {
                sendOutgoingMessages(World.step(world));
            }
        };

        var sendOutgoingMessages = function(messages) {
            messageHandler(messages);
        };

        var receiveMessage = function(message) {
            inMQ.push(message);
        };

        var getWorld = function() {
            return world;
        };

        var addPlayer = function(playerConfig, callback) {
            inMQ.push({
                type: 'addPlayer',
                config: playerConfig,
                callback: callback
            });
        };

        var removePlayer = function(id) {

        };

        var loadWorld = function(worldConfig) {
            world.loadFrom(worldConfig);
        };

        _.extend(simulator, {
            getWorld: getWorld,
            stepWorldToNow: stepWorldToNow,
            receiveMessage: receiveMessage,
            addPlayer: addPlayer,
            removePlayer: removePlayer
        });

        return simulator;
    };

    facerace.Simulator = exports.Simulator;
})();
