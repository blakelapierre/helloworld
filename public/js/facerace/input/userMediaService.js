// I think I found this somewhere. If you find the source let me know: blakelapierre@gmail.com

angular.module('facerace')
.service('userMediaService', function() {
	navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
	window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext;

	var getUserMedia = function(query, success, error) {
		navigator.getUserMedia(query, success, error);
	};

	var getSourceByKind = function(kind, label, callback) {
		MediaStreamTrack.getSources(function(sources) {
			callback(_.chain(sources)
						.where({kind: kind})
						.map(function(source, index) {
							return {
								id: source.id,
								label: source.label,
								facing: source.facing,
								name: source.label || source.facing || label + (index + 1)
							};
						}).value());
		});
	};

	var getVideoSources = _.partial(getSourceByKind, 'video', 'Camera #');
	var getAudioSources = _.partial(getSourceByKind, 'audio', 'Microphone #');

	var getVideoStream = function(sourceID, success, error) {
		getUserMedia({video: sourceID == null ? true : {optional: [{sourceId: sourceID}]}}, success, error);
	};

	var getAudioStream = function(sourceID, success, error) {
		getUserMedia({audio: {optional: [{sourceId: sourceID}]}}, success, error);
	};

	var audioContext = new window.AudioContext;
	var getRecorder = function(sourceID, success, error) {
		getAudioStream(sourceID, function(stream) {
			var input = audioContext.createMediaStreamSource(stream);
			input.connect(audioContext.destination);
			success(new Recorder(input));
		}, function(msg) {
			error(msg);
		});
	};

	var getVideo = function(sourceID, config) {
		var video = document.createElement('video');

		_.extend(video, {
			width: 320,
			height: 240,
			autoplay: true	
		}, config);

		getVideoStream(sourceID, function(stream) {
			video.src = window.URL.createObjectURL(stream);
		});

		return video;
	};

	_.extend(this, {
		getUserMedia: getUserMedia,
		getSourceByKind: getSourceByKind,
		getVideoSources: getVideoSources,
		getAudioSources: getAudioSources,
		getVideoStream: getVideoStream,
		getRecorder: getRecorder,
		getVideo: getVideo
	});
});