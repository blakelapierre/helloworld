angular.module('facerace')

.directive('vehicleInstrumentation', function() {
	return {
		restrict: 'A',
		scope: {
			target: '='
		},
		link: function($scope, element, attribute, controller) {
			var metrics = $scope.metrics,
				charts = $scope.charts;


			$scope.$watch('target', function(newValue, oldValue) {
				console.log('target', newValue);
				if (newValue) {
					_.each(charts, function(chart, metric) {
						if (chart.currentTimeSeries) chart.removeTimeSeries(chart.currentTimeSeries);
						chart.currentTimeSeries = new TimeSeries();
						chart.addTimeSeries(chart.currentTimeSeries);

						setInterval(function() {
							chart.currentTimeSeries.append(new Date().getTime(), newValue[metric]);
							//chart.currentTimeSeries.append(vec3.length(newValue[metric]));
						}, 20);
					});
				}
			});

			$scope.canvasCreated = function(metric) {
				console.log('e', element.children());
				var chart = new SmoothieChart({
						yRangeFunction: function() {
							return {min: 0, max: 500};
						}
					}),
					canvas = element.children()[0];
				
				console.log(element.children('.' + metric));
				console.log('c', canvas);					
				chart.streamTo(canvas);

				charts[metric] = chart;
			};

			$scope.metrics = metrics;
		},
		controller: function($scope) {
			$scope.metrics = ['speed'];
			$scope.charts = {};
		}
	};
});