angular.module('facerace')
.directive('playerController', function() {
	return {
		link: function($scope, element, attribute) {
			var controls = $scope.controls;

			var keymap = {
				// tab
				9 : function(b) { $scope.infoVisible = b && !$scope.infoVisible || !b && $scope.infoVisible; $scope.controlsChanged(); },
				// space
				32: function(b) { controls.space= b; $scope.controlsChanged(); },
				// left arrow
				37: function(b) { controls.left = b; setTurn(); $scope.controlsChanged(); },
				// up arrow
				38: function(b) { controls.up	= b; $scope.controlsChanged(); },
				// right arrow
				39: function(b) { controls.right= b; setTurn(); $scope.controlsChanged(); },
				// down arrow
				40: function(b) { controls.down = b; $scope.controlsChanged(); },
				// c
				67: function(b) { $scope.configVisible = b && !$scope.configVisible || !b && $scope.configVisible; $scope.controlsChanged(); }
			};

			keymap[65] = keymap[37]; // a
			keymap[87] = keymap[38]; // w
			keymap[68] = keymap[39]; // d
			keymap[83] = keymap[40]; // s

			var setTurn = function() {
				var turn = 0;
				if (controls.left) turn -= 60;
				if (controls.right) turn += 60;
				controls.turn = turn;
			};

			$(window).bind('keydown', function(event) {
				var key = keymap[event.which];
				if (key) {
					key(true);
					event.preventDefault();
					event.stopPropagation();
				}
			});

			$(window).bind('keyup', function(event) {
				var key = keymap[event.which];
				if (key) {
					key(false);
					event.preventDefault();
					event.stopPropagation();
				}
			});
		}
	};
});