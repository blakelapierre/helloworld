_.each([
	'./hud/messageArea.js',
	'./hud/orientationMetrics.js',
	'./hud/vehicleInstrumentation.js',
	'./input/camera.js',
	'./input/microphone.js',
	'./input/playerController.js',
	'./input/userMediaService.js',
	'./scene/scene.js',
	'./debug.js',
	'./facerace.js'
], require);

module.exports = angular.module('facerace', ['angular-gestures', 'faceraceDebug']);