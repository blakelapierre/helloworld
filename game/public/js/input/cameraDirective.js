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
				var peer = {id: $scope.peers.length};
				$scope.peers.push(peer);

				$scope.$digest(function() {
					var id = 'peer-video-' + peer.id.toString();
					console.log(id);
					rtc.attachStream(stream, id);
				});
			});
		}
	};	
};