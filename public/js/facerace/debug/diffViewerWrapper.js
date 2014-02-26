angular.module('facerace')
.directive('diffViewerWrapper', function() {
	return {
		restrict: 'E',
		replace: true,
		scope: {
			object: '='
		},
		link: function($scope, element, attributes) {
			var update = function() {
				var o = $scope.object || {},
					previous = o.previous,
					current = o.current;

				if (previous && current) {
					var diff = jsondiffpatch.diff(previous, current);
					element.empty().append(jsondiffpatch.html.diffToHtml(previous, current, diff));
				}
			};

			$scope.$watch('object', update);
		}
	}
});