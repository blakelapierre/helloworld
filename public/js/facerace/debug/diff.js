angular.module('facerace')
.directive('diffViewer', function() {
	return {
		templateUrl: '/js/facerace/debug/diff.html',
		restrict: 'E',
		scope: {
			states: '='
		},
		link: function($scope, element, attributes) {
			

		},
		controller: function($scope, $sce) {
			$scope.currentState = 0;

			$scope.next = function() {
				$scope.currentState++;
			};

			$scope.$watch('currentState', function(newState) {
				if (newState < 1) return; 
				var prev = $scope.states[Math.max(0, newState - 1)],
					next = $scope.states[newState];

				$scope.stateToView = {previous: prev, current: next};
			});
		}
	}
});