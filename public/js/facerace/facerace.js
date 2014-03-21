angular.module('facerace')
.directive('facerace', function(userMediaService) {
	return {
		restrict: 'E',
		link: function($scope, element, attributes) { },
		controller:  ['$scope', function($scope) {
			var controls = {turn: 0, quaternion: [0, 0, 0, 1]},
				config = {
					camera: {},
					webcam: userMediaService.getVideo()
				},
				calibration = null;
			
			this.setClient = function(client) {
				$scope.faceraceClient = client;
				$scope.metrics = {latency: 0};
				
				client.on('metrics', function(metrics) {
					$scope.metrics = metrics;
					$scope.debugObject = {
						metrics: $scope.metrics,
						config: $scope.config
					};

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
				//controls.turn = event.beta - calibration[1];
				controls.turn = event.beta / 180 * Math.PI;

				// http://www.euclideanspace.com/maths/geometry/rotations/conversions/eulerToQuaternion/index.htm
				// https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Using_device_orientation_with_3D_transforms
				var ah = ((event.alpha - 180) / 2) / 180 * Math.PI, // z
					bh = (event.beta / 2) / 180 * Math.PI,  // x
					gh = (/*-*/event.gamma / 2) / 180 * Math.PI, // y
					c1 = Math.cos(gh),
					c2 = Math.cos(ah),
					c3 = Math.cos(bh),
					s1 = Math.sin(gh),
					s2 = Math.sin(ah),
					s3 = Math.sin(bh);

				// ZXY (AlphaBetaGamma) ordering
				controls.quaternion = [
					s1 * c2 * c3 - c1 * s2 * s3,
					c1 * s2 * c3 - s1 * c2 * s3,
					c1 * c2 * s3 + s1 * s2 * c3,
					c1 * c2 * c3 + s1 * s2 * s3
				];

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

			// $scope.infoVisible = true;
			// $scope.showCamera = true;
			// $scope.showMicrophone = true;
		}]
	};
});