angular.module('faceraceDebug', [])
.directive('objectEditor', function() {
	return {
		template: '<div ng-include="getUrl()"></div>',
		scope: {
			object: '='
		},

		link: function($scope, element, attributes) {

			$scope.expand = {};
			$scope.getUrl = function() {
				console.log('geturl', $scope.object);
				return $scope.isNull($scope.object) ? null : '/partials/objectEditor.html';
			};

			$scope.isType = function(value, type) {
				return typeof value === type;
			};

			$scope.isNull = function(value) {
				return value === null || typeof value === 'undefined';
			};

			$scope.toggle = function() {
				console.log('t', arguments);
			};

			$scope.$watch('object', function() {
				console.log('watch', arguments);
			});
			console.log('scope', $scope);
			console.log(element);
		}
	};
});