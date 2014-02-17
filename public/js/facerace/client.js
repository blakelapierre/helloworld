angular.module('facerace')
.controller('ClientCtrl', ['$scope', function($scope) {
	var controls = {turn: 0},
		controlsMetrics = {
			alpha: new TimeSeries(),
			beta: new TimeSeries(),
			gamma: new TimeSeries()
		};

	var config = {
		camera: {
			
		}
	};

	var controlsChanged = function() {
		$scope.$apply();
	};

	var orientationListener = function(event) {
		controls.turn = event.beta - controls.calibration[1];

		if ($scope.debug) {
			var now = new Date().getTime();
			controlsMetrics.alpha.append(now, event.alpha);
			controlsMetrics.beta.append(now, event.beta);
			controlsMetrics.gamma.append(now, event.gamma);
		}

		controlsChanged();
	};
	window.addEventListener('deviceorientation', orientationListener);

	_.extend($scope, {
		debug: true,
		controls: controls,
		config: config,
		controlsMetrics: controlsMetrics,
		accelerate: function() {
			controls.up = true;
		},
		brake: function() {
			controls.up = false;
		},
		calibrate: function() {
			var callback = function(event) {
				controls.calibration = [event.alpha, event.beta, event.gamma];
				window.removeEventListener('deviceorientation', callback);
				window.addEventListener('deviceorientation', orientationListener);
			};
			window.removeEventListener('deviceorientation', orientationListener);
			window.addEventListener('deviceorientation', callback);
		},
		controlsChanged: controlsChanged
	});

	$scope.$watch('faceData', function(data) {
		if (data) {
			$scope.faceraceClient.setFace(data);
			$scope.showCamera = false;
		}
	});

	$scope.$watch('configVisible', function(newValue) {
		console.log('config');
		setTimeout($scope.faceraceClient.resize, 0);
	});

	$scope.calibrate();

	//$scope.configVisible = true;

	$scope.debugObject = {
		config: config
	};
	// $scope.showCamera = true;
}]);