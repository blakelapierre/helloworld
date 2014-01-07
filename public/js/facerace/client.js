angular.module('facerace', ['angular-gestures'])
.controller('ClientCtrl', ['$scope', '$timeout', 'socket', function($scope, $timeout, socket) {
	// var simulator = faceraceSimulator(20),
	// 	player = simulator.addPlayer('blake', '/images/faces/blake.png');

	// simulator.addPlayer({
	// 	name: 'kim',
	// 	orientation: [0, 0, 0],
	// 	position: [400, -80, 300],
	// 	velocity: [0, 0, 0],
	// 	acceleration: [0, 0, 0],
	// 	direction: 0,
	// 	controls: {
	// 		left: false,
	// 		up: false,
	// 		right: false,
	// 		down: false,
	// 		orientation: [0, 0, 0],
	// 		calibration: [0, 0, 0]
	// 	},
	// 	vehicle: {
	// 		speed: 20
	// 	},
	// 	face: '/images/faces/kim.png',
	// 	style: {},
	// 	scale: 0.1
	// });

	// $scope.world = simulator.world;
	// $scope.players = simulator.world.players;
	// $scope.controls = $scope.players[0].controls;

	var controls = {};

	$scope.world = {};
	$scope.players = [];
	$scope.stars = [];
	$scope.controls = controls;

	var player, playerIndex;

	var emit = function(name, data) { socket.emit(name, data); };
	
	$scope.controlsChanged = function() {
		if (player) emit('controls', {step: $scope.world.step, controls: _.extend({}, controls)});
	};

	emit('joinGame', {name: 'blake', image: '/images/faces/blake.png'});

	socket.on('welcome', function(data) {
		var world = data.world;
		$scope.world = world;
		$scope.players = world.players;
		$scope.stars = world.stars;

		playerIndex = world.playerMap[data.playerID];
		player = world.players[playerIndex];

		window.addEventListener('deviceorientation', function(event) {
			controls.orientation = [event.alpha, event.beta, event.gamma];
			$scope.controlsChanged();
		});

		window.requestAnimationFrame(step);
	});

	socket.on('world', function(data) {
		_.extend($scope.world, data.world);
		
		_.each(data.world.players, function(player, index) {
			_.extend($scope.players[index], player);
		});

		_.each(data.world.stars, function(star, index) {
			_.extend($scope.stars[index], star);
		});

		var index = data.world.playerMap[data.playerID];
		if (index !== playerIndex) {
			playerIndex = index;
			player = data.world.players[playerIndex];			
		}
		//_.extend(player, data.world.players[data.world.playerMap[data.playerID]]);
		//$scope.players = world.players;
		//player = world.players[0];
	});

	var step = function(timestamp) {
	//	simulator.processStep();
		
		_.each($scope.players, setPlayerStyle);
		_.each($scope.stars, setPlayerStyle);

		setRotation([-20, 180 - player.orientation[1], 0]);
		setTranslation([player.position[0] - ($scope.windowWidth / 2), player.position[2], player.position[1]]);
		
		$scope.$apply();

		window.requestAnimationFrame(step);
	};
	

	var rotation = [-45, 0, 0],
		translation = [0, 0, 0];

	var setRotation = function(rotation) {
		$scope.cameraStyle = {
			'-webkit-transform':'rotateX(\n' + rotation[0] + 'deg)\n' + 
								'rotateY(\n' + rotation[1] + 'deg)\n' +
								'rotateZ(\n' + rotation[2] + 'deg)'
		};
	};

	var setTranslation = function(translation) {
		
		$scope.assemblyStyle = {
			'-webkit-transform': (translation[0] == 0 ? '' : 'translateX(\n' + (-translation[0]) + 'px)\n') +
								 (translation[1] == 0 ? '' : 'translateY(\n' + (-translation[1]) + 'px)\n') +
								 (translation[2] == 0 ? '' : 'translateZ(\n' + (-translation[2]) + 'px)')
		};
	};

	var setPlayerStyle = function(player) {
		player.style['-webkit-transform'] =  'translateX(' + player.position[0] + 'px)' +
											' translateY(' + player.position[1] + 'px)' +
											' translateZ(' + player.position[2] + 'px)' +
											' rotateX(' + player.orientation[0] + 'deg)' +
											' rotateY(' + player.orientation[1] + 'deg)' +
											' rotateZ(' + player.orientation[2] + 'deg)' +
											' scaleX(' + (player.scale || 1) + ') scaleY(' + (player.scale || 1) + ') scaleZ(' + (player.scale || 1) +')';
	};

	setRotation(rotation);
	setTranslation(translation);

	var calibrate = function() {
		var callback = function(event) {
			$scope.controls.calibration = [event.alpha, event.beta, event.gamma];
			window.removeEventListener('deviceorientation', callback);
			$scope.controlsChanged();
			console.log(controls);
		};
		window.addEventListener('deviceorientation', callback);
	};

	$scope.accelerate = function() {
		$scope.controls.up = true;
		$scope.controlsChanged();
	};

	$scope.brake = function() {
		$scope.controls.up = false;
		$scope.controlsChanged();	
	};

	$scope.calibrate = calibrate;
	calibrate();
}])
.directive('viewport', function() {
	return {
		link: function($scope, element, attribute) {
			element.addClass('viewport');
						

			var zoom = 400,
				maxZoom = -3000,
				minZoom = 500,
				zoomStep = 20;

			var update = function() {
				element[0].style['-webkit-transform'] = 'translateZ(' + zoom + 'px) translateY(' + ($(element).height() / 2) + 'px) ';
			};

			$(window).on('keypress', function(event) {
				switch (event.which) {
					case 43: // -
						zoom = Math.max(zoom - zoomStep, maxZoom);
						break;
					case 45: // +
						zoom = Math.min(zoom + zoomStep, minZoom);
						break;
				}
				update();
			});

			update();

			$scope.windowWidth = $(window).width();
			console.log($scope.windowWidth);

			// height is sometimes 0 when this function runs, so run it again later in those cases
			if ($(element).height() == 0) setTimeout(update, 1000);
		}
	};
})
.directive('playerController', function() {
	return {
		link: function($scope, element, attribute) {
			var controls = $scope.controls;

			$(window).bind('keydown', function(event) {
				switch (event.which) {
					case 37:
						controls.left = true;
						break;
					case 38:
						controls.up = true;
						break;
					case 39:
						controls.right = true;
						break;
					case 40:
						controls.down = true;
						break;
				};
				$scope.controlsChanged();
			});

			$(window).bind('keyup', function(event) {
				switch (event.which) {
					case 37:
						controls.left = false;
						break;
					case 38:
						controls.up = false;
						break;
					case 39:
						controls.right = false;
						break;
					case 40:
						controls.down = false;
						break;
				};
				$scope.controlsChanged();
			});
		}
	};
})
.factory('socket', function($rootScope) {
	var socket = io.connect('http://' + window.location.host);
	return socket;
});