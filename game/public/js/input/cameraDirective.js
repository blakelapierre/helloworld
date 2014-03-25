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
				console.log(stream, socketID);
				var peer = {
					id: $scope.peers.length,
					stream: stream
				};
				$scope.peers.push(peer);

				$scope.$apply();
			});

			$scope.$watch('peers', function(newValue) {
				for (var i = 0; i < $scope.peers.length; i++) {
					var peer = $scope.peers[i];
					if (peer.video == null) {
						peer.video = 'peer-video-' + peer.id.toString();
						rtc.attachStream(peer.stream, peer.video);
					}
				}
			});
		}
	};	
};