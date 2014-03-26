var angular = require('angular'),
	_ = require('underscore');

module.exports = function CameraDirective($sce) {
	return {
		restrict: 'E',
		link: function($scope, element, attributes) {
			var createVideo = function(stream) {
				var video = document.createElement('video');
				video.src = $sce.trustAsResourceUrl(URL.createObjectURL(stream));
				video.autoplay = true;

				element.append(video);
			};
			$scope.videoSources = [];

			rtc.createStream({video: true, audio: true}, function(stream) {
				createVideo(stream);
			});

			rtc.connect('ws://' + window.location.hostname + ':3007', 'facerace');

			rtc.on('add remote stream', function(stream, socketID) {
				var peer = {
					elementID: 'peer-video-' + socketID,
					socketID: socketID,
					streamSource: $sce.trustAsResourceUrl(URL.createObjectURL(stream))
				};
				createVideo(stream, socketID);
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