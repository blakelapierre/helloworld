angular.module('facerace')
.directive('orientationMetrics', function() {
	return {
		link: function($scope, element, attribute) {
			_.each(['alpha', 'beta', 'gamma'], function(metric) {
				var chart = new SmoothieChart({maxValueScale: 2.0});
				chart.addTimeSeries($scope.controlsMetrics[metric]);
				chart.streamTo(element.children('.' + metric)[0]);
			});
			if (!$scope.debug) element.hide();
		}
	};
});