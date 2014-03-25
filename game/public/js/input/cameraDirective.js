var angular = require('angular'),
	_ = require('underscore');

module.exports = function CameraDirective($sce) {
	return {
		restrict: 'E',
		template: require('./cameraTemplate.html'),
		link: function($scope, element, attributes) {
			$scope.peers = [];

			rtc.createStream({video: true, audio: true}, function(stream) {
				$scope.localStreamSource = $sce.trustAsResourceUrl(URL.createObjectURL(stream));
				$scope.$apply();
			});

			rtc.connect('ws://' + window.location.hostname + ':3007', 'facerace');

			rtc.on('add remote stream', function(stream, socketID) {
				var peer = {
					socketID: socketID,
					streamSource: $sce.trustAsResourceUrl(URL.createObjectURL(stream))
				};
				$scope.peers.push(peer);

				$scope.$apply();
			});

			rtc.on('disconnect stream', function(socketID) {
				var index = 0;
				for (var i = 0; i < $scope.peers.length; i++) {
					if ($scope.peers.socketID == socketID) {
						index = i;
						break;
					}
				}
				$scope.peers.splice(index, 1);
				$scope.$apply();
			});
		}
	};	
};