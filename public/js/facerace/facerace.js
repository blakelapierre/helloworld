angular.module('facerace')
.directive('facerace', function() {
	return {
		restrict: 'E',
		link: function($scope, element, attributes) { },
		controller:  ['$scope', function($scope) {
			var controls = {turn: 0},
				config = {camera: {}},
				calibration = null;
			
			this.setClient = function(client) {
				$scope.faceraceClient = client;

				client.on('playerMetrics', function(metrics) {
					$scope.playerMetrics = metrics;
					$scope.debugObject = {
						playerMetrics: $scope.playerMetrics,
						config: $scope.config
					};

					$scope.debugObject = client.world;

					$scope.$apply();
				});

				client.on('tick', function() {
					$scope.$apply();
				});

				client.on('message', function(message) {
					showMessage(message);
				});
			};

			var showMessage = function() {};
			this.setMessageFn = function(fn) {
				showMessage = fn;
			};

			var orientationListener = function(event) {
				controls.turn = event.beta - calibration[1];

				if ($scope.debug) {
					var now = new Date().getTime(),
						controlsMetrics = $scope.controlsMetrics;
					controlsMetrics.alpha.append(now, event.alpha);
					controlsMetrics.beta.append(now, event.beta);
					controlsMetrics.gamma.append(now, event.gamma);
				}
			};
			window.addEventListener('deviceorientation', orientationListener);

			_.extend($scope, {
				debug: true,
				controls: controls,
				config: config,
				accelerate: function() {
					controls.up = true;
				},
				brake: function() {
					controls.up = false;
				},
				calibrate: function() {
					var callback = function(event) {
						calibration = [event.alpha, event.beta, event.gamma];
						window.removeEventListener('deviceorientation', callback);
						window.addEventListener('deviceorientation', orientationListener);
					};
					window.removeEventListener('deviceorientation', orientationListener);
					window.addEventListener('deviceorientation', callback);
				}
			});

			$scope.$watch('faceData', function(data) {
				if (data) {
					$scope.faceraceClient.setFace(data);
					$scope.showCamera = false;
				}
			});

			$scope.$watch('configVisible', function(newValue) {
				setTimeout($scope.faceraceClient.resize, 0);
			});

			$scope.calibrate();

			$scope.debugObject = {
				config: config
			};
		}]
	};
});