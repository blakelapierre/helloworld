angular.module('facerace')
    .directive('orientationMetrics', function() {
        return {
            link: function($scope, element, attribute) {
                $scope.controlsMetrics = $scope.controlsMetrics || {};

                _.each(['alpha', 'beta', 'gamma'], function(metric) {
                    var chart = new SmoothieChart({
                        maxValueScale: 2.0
                    }),
                        timeSeries = new TimeSeries();

                    chart.addTimeSeries(timeSeries);
                    chart.streamTo(element.children('.' + metric)[0]);

                    $scope.controlsMetrics[metric] = timeSeries;
                });
                if (!$scope.debug) element.hide();
            }
        };
    });
