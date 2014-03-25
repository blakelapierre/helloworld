var angular = require('angular');

module.exports = function CameraDirective() {
	return {
		restrict: 'E',
		template: require('./cameraTemplate.html'),
		link: function($scope, element, attributes) {
			$scope.peers = [];

			rtc.createStream({video: true, audio: true}, function(stream) {
				rtc.attachStream(stream, 'local-video');
			});

			rtc.connect('ws://' + window.location.hostname + ':3007', 'facerace');

			rtc.on('add remote stream', function(stream, socketID) {
				var peer = {
					socketID: socketID,
					stream: stream
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

			$scope.$watchCollection('peers', function(newValue) {
				for (var i = 0; i < $scope.peers.length; i++) {
					var peer = $scope.peers[i];
					if (peer.video == null) {
						peer.video = 'peer-video-' + peer.socketID;
						setTimeout(function() {rtc.attachStream(peer.stream, peer.video)}, 100);
					}
				}
			});
		}
	};	
};