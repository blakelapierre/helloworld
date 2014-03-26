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
				video.style.display = 'none';
				
				element.append(video);

				return {
					element: video,
					src: video.src,
					stream: stream,
					socketID: socketID || 'local'
				};
			};

			$scope.sources = {};

			rtc.createStream({video: true, audio: true}, function(stream) {
				var video = createVideo(stream);
				$scope.sources[video.socketID] = video;
				$scope.$apply();
			});

			rtc.connect('ws://' + window.location.hostname + ':3007', 'facerace');

			rtc.on('add remote stream', function(stream, socketID) {
				var video = createVideo(stream, socketID);
				$scope.sources[video.socketID] = video;
				$scope.$apply();
			});

			rtc.on('disconnect stream', function(socketID) {
				delete $scope.sources[socketID];
			});
		}
	};	
};