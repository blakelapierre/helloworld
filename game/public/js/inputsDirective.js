var angular = require('angular'),
	_ = require('underscore');

module.exports = function CameraDirective($sce) {
	return {
		restrict: 'E',
		link: function($scope, element, attributes) {
			var createVideo = function(stream, socketID) {
				var video = document.createElement('video');
				video.src = $sce.trustAsResourceUrl(URL.createObjectURL(stream));
				video.autoplay = true;

				element.append(video);

				return {
					element: video,
					src: video.src,
					stream: stream,
					socketID: socketID || 'local'
				};
			};

			$scope.videoSources = [];

			rtc.createStream({video: true, audio: true}, function(stream) {
				$scope.videoSources.push(createVideo(stream));
			});

			rtc.connect('ws://' + window.location.hostname + ':3007', 'facerace');

			rtc.on('add remote stream', function(stream, socketID) {
				$scope.videoSources.push(createVideo(stream, socketID));
			});

			rtc.on('disconnect stream', function(socketID) {
				var index = 0;
				for (var i = 0; i < $scope.videoSources.length; i++) {
					var source = $scope.videoSources[i];
					if (source.socketID == socketID) {
						source.element.remove();
						$scope.videoSources.splice(i, 1);
						break; // get out of here now! :)
					}
				}
			});
		}
	};	
};