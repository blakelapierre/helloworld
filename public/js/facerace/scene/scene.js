angular.module('facerace')
.directive('scene', function() {
	return {
		link: function($scope, element, attribute) {
			var client = faceraceClient('http://' + window.location.host, element, $scope.controls, $scope.config);
			
			var interval = null;
			client.on('playerMetrics', function(metrics) {
				$scope.playerMetrics = metrics;
				$scope.debugObject = {
					playerMetrics: $scope.playerMetrics,
					config: $scope.config
				};

				$scope.$apply();
			});


			$scope.faceraceClient = client;
		}
	};
});