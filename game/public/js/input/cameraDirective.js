var angular = require('angular');

module.exports = function CameraDirective() {
	return {
		restrict: 'E',
		template: require('./cameraTemplate.html'),
		link: function($scope, element, attributes) {
			rtc.createStream({video: true, audio: true}, function(stream) {
				rtc.attachStream(stream, 'local-video');
			});

			rtc.connect('ws://' + window.location.hostname + ':3007', 'facerace');

			rtc.on('add remote stream', function(stream, socketID) {
				console.log(stream, socketID);
				var peer = {id: $scope.peers.length};
				$scope.peers.push(peer);

				$scope.apply(function() {
					rtc.attachStream(stream, 'peer-video-' + peer.id);
				});
			});
		}
	};	
};