angular.module('faceraceDebug', [])
.directive('objectEditor', function() {
	return {
		template: '<div class="object-editor" ng-include="getUrl()"></div>',
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

			$scope.typeOf = function(value) {
				console.log('typeof', value, typeof value);
				return typeof value;
			};

			$scope.ex = function(key) {
				console.log('ex', key);
				$scope.expand[key] = !$scope.expand[key];
			};

			$scope.$watch('object', function() {
				console.log('watch', arguments);
			});
			console.log('scope', $scope);
			console.log(element);
		}
	};
});