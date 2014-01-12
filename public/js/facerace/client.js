angular.module('facerace', ['angular-gestures'])
.controller('ClientCtrl', ['$scope', function($scope) {
	var controls = {};

	var controlsChanged = function() {
		$scope.$apply();
	};

	window.addEventListener('deviceorientation', function(event) {
		controls.orientation = [event.alpha, event.beta, event.gamma];
		controlsChanged();
	});

	_.extend($scope, {
		controls: controls,
		accelerate: function() {
			controls.up = true;
			controlsChanged();
		},
		brake: function() {
			controls.up = false;
			controlsChanged();
		},
		calibrate: function() {
			var callback = function(event) {
				controls.calibration = [event.alpha, event.beta, event.gamma];
				window.removeEventListener('deviceorientation', callback);
			};
			window.addEventListener('deviceorientation', callback);
		},
		controlsChanged: controlsChanged
	});

	$scope.calibrate();
}])
.directive('scene', function() {
	return {
		link: function($scope, element, attribute) {
			$scope.faceraceClient = faceraceClient('http://' + window.location.host, element, $scope.controls);
		}
	};
})
.directive('playerController', function() {
	return {
		link: function($scope, element, attribute) {
			var controls = $scope.controls;

			var keymap = {
				32: function(b) { controls.space= b; $scope.controlsChanged(); },
				37: function(b) { controls.left	= b; $scope.controlsChanged(); },
				38: function(b) { controls.up	= b; $scope.controlsChanged(); },
				39: function(b) { controls.right= b; $scope.controlsChanged(); },
				40: function(b) { controls.down = b; $scope.controlsChanged(); }
			};

			$(window).bind('keydown', function(event) {
				var key = keymap[event.which];
				if (key) key(true);
			});

			$(window).bind('keyup', function(event) {
				var key = keymap[event.which];
				if (key) key(false);
			});
		}
	};
});