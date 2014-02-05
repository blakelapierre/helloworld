angular.module('facerace', ['angular-gestures'])
.controller('ClientCtrl', ['$scope', function($scope) {
	var controls = {turn: 0},
		controlsMetrics = {
			alpha: new TimeSeries(),
			beta: new TimeSeries(),
			gamma: new TimeSeries()
		};

	var config = {
		camera: {
			
		}
	};

	var controlsChanged = function() {
		$scope.$apply();
	};

	var orientationListener = function(event) {
		controls.orientation = [event.alpha, event.beta, event.gamma];
		controls.turn = controls.orientation[1] - controls.calibration[1];

		if ($scope.debug) {
			var now = new Date().getTime();
			controlsMetrics.alpha.append(now, event.alpha);
			controlsMetrics.beta.append(now, event.beta);
			controlsMetrics.gamma.append(now, event.gamma);
		}

		controlsChanged();
	};
	window.addEventListener('deviceorientation', orientationListener);

	_.extend($scope, {
		debug: true,
		controls: controls,
		config: config,
		controlsMetrics: controlsMetrics,
		accelerate: function() {
			controls.up = true;
		},
		brake: function() {
			controls.up = false;
		},
		calibrate: function() {
			var callback = function(event) {
				controls.calibration = [event.alpha, event.beta, event.gamma];
				window.removeEventListener('deviceorientation', callback);
				window.addEventListener('deviceorientation', orientationListener);
			};
			window.removeEventListener('deviceorientation', orientationListener);
			window.addEventListener('deviceorientation', callback);
		},
		controlsChanged: controlsChanged
	});

	$scope.$watch('faceData', function(data) {
		if (data) {
			$scope.faceraceClient.setFace(data);
			$scope.showCamera = false;
		}
	});

	$scope.$watch('configVisible', function(newValue) {
		console.log('config');
		setTimeout($scope.faceraceClient.resize, 0);
	});

	$scope.calibrate();

	$scope.configVisible = true;

	// $scope.showCamera = true;
}])
.directive('scene', function() {
	return {
		link: function($scope, element, attribute) {
			var client = faceraceClient('http://' + window.location.host, element, $scope.controls, $scope.config);
			console.log(client);
			client.on('playerMetrics', function(metrics) {
				$scope.playerMetrics = metrics;
			});

			$scope.faceraceClient = client;
		}
	};
})
.directive('playerController', function() {
	return {
		link: function($scope, element, attribute) {
			var controls = $scope.controls;

			var keymap = {
				// tab
				9 : function(b) { $scope.infoVisible = b && !$scope.infoVisible || !b && $scope.infoVisible; $scope.controlsChanged(); },
				// space
				32: function(b) { controls.space= b; $scope.controlsChanged(); },
				// left arrow
				37: function(b) { controls.left = b; setTurn(); $scope.controlsChanged(); },
				// up arrow
				38: function(b) { controls.up	= b; $scope.controlsChanged(); },
				// right arrow
				39: function(b) { controls.right= b; setTurn(); $scope.controlsChanged(); },
				// down arrow
				40: function(b) { controls.down = b; $scope.controlsChanged(); },
				// c
				67: function(b) { $scope.configVisible = b && !$scope.configVisible || !b && $scope.configVisible; $scope.controlsChanged(); }
			};

			keymap[65] = keymap[37]; // a
			keymap[87] = keymap[38]; // w
			keymap[68] = keymap[39]; // d
			keymap[83] = keymap[40]; // s

			var setTurn = function() {
				var turn = 0;
				if (controls.left) turn -= 60;
				if (controls.right) turn += 60;
				controls.turn = turn;
			};

			$(window).bind('keydown', function(event) {
				var key = keymap[event.which];
				if (key) {
					key(true);
					event.preventDefault();
					event.stopPropagation();
				}
			});

			$(window).bind('keyup', function(event) {
				var key = keymap[event.which];
				if (key) {
					key(false);
					event.preventDefault();
					event.stopPropagation();
				}
			});
		}
	};
})
.directive('orientationMetrics', function() {
	return {
		link: function($scope, element, attribute) {
			_.each(['alpha', 'beta', 'gamma'], function(metric) {
				var chart = new SmoothieChart({maxValueScale: 2.0});
				chart.addTimeSeries($scope.controlsMetrics[metric]);
				chart.streamTo(element.children('.' + metric)[0]);
			});
			if (!$scope.debug) element.hide();
		}
	};
})
.directive('camera', function($sce) {
	return {
		template: 
			'<div class="camera" ng-show="showCamera">' +
				'<div class="inner">' +
					'<div class="step-1" ng-show="currentStep == 1">' +
						'<h2 class="text-center">Capture Your Face</h2>' +
						'<div class="btn-group">' +
							'<button ng-class="{\'btn\': true, \'btn-primary\': source == currentSource}" ng-repeat="source in videoSources" ng-click="setSource(source)">{{source.name}}</button>' +
						'</div>' +
						 '<div class="live-video">' +
							'<video src="{{currentStreamUrl}}" width="{{width}}" height="{{height}}" autoplay hm-tap="takePhoto()">Please allow the camera.</video>' +
						 '</div>' +
						 '<button class="btn bnt-default" ng-click="currentSource = null; showCamera = false;">Just Play!</button>' +
					'</div>' +
					'<div class="step-2" ng-show="currentStep == 2">' +
						'<h2 class="text-center">Crop</h2>' +
						'<h5 class="text-center">Make sure your face is within the rectangle!</h5>' +
						'<canvas class="full-photo" width="{{width}}" height="{{height}}" style="display:none;"></canvas>' +
						'<canvas class="crop-space-photo" width="{{width}}" height="{{height}}" hm-drag="drag($event)" ng-click="click($event)"></canvas>' +
						'<div class="btn-group">' +
							'<button ng-click="currentStep = 1" class="btn btn-danger text-left"><span class="glyphicon glyphicon-arrow-left"></span></button>' +
							'<button ng-click="currentStep = 3" class="btn btn-default text-right"><span class="glyphicon glyphicon-ok"></span></button>' +
						'</div>' +
					'</div>' +
					'<div class="step-3" ng-show="currentStep == 3">' +
						'<h2 class="text-center">Confirm Face</h2>' +
						'<h5 class="text-center">Is this really the face you want to race with?</h5>' +
						'<canvas class="final-photo" width="{{finalWidth}}" height="{{finalHeight}}"></canvas>' +
						'<div class="btn-group">' +
							'<button ng-click="currentStep = 2" class="btn btn-danger text-left"><span class="glyphicon glyphicon-arrow-left"></span></button>' +
							'<button ng-click="done()" class="btn btn-default text-right"><span class="glyphicon glyphicon-ok"></span></button>' +
						'</div>' +
					'</div>' +
				'</div>' +
			'</div>',
		restrict: 'E',
		replace: true,
		scope: {
			showCamera: '=',
			faceData: '='
		},
		link: function($scope, element, attribute) {
			$scope.currentStep = 1;
			$scope.width = 320;
			$scope.height = 240;

			var canvases = element.find('canvas'),
				fullCanvas = canvases[0],
				cropCanvas = canvases[1],
				finalCanvas = canvases[2],
				fullContext = fullCanvas.getContext('2d'),
				cropContext = cropCanvas.getContext('2d'),
				finalContext = finalCanvas.getContext('2d'),
				video = element.find('video')[0],
				finalWidth = 128,
				finalHeight = 160;

			finalContext.globalAlpha = 0.5;

			$scope.finalWidth = finalWidth;
			$scope.finalHeight = finalHeight;

			var crop = {
				location: [($scope.width / 2) - (finalWidth / 2), ($scope.height / 2) - (finalHeight / 2)],
				size: [finalWidth, finalHeight]
			};
			$scope.crop = crop;

			$scope.done = function() {
				$scope.faceData = finalCanvas.toDataURL('image/png');
				if ($scope.currentStream) $scope.currentStream.stop(); // please clean this up!
			};

			$scope.drag = function(e) {
				if (e.type == 'drag') {
					e.gesture.preventDefault();
					crop.location = [e.gesture.center.pageX - e.target.offsetLeft - (crop.size[0] / 2), e.gesture.center.pageY - e.target.offsetTop - (crop.size[1] / 2)];
				}
				else if (e.type == 'click') {
					crop.location = [e.offsetX - (crop.size[0] / 2), e.offsetY - (crop.size[1] / 2)];
				}
			};

			$scope.tap = function(e) {
				crop.location = [e.gesture.center.pageX - e.target.offsetLeft, e.gesture.center.pageY - e.target.offsetTop];
			};

			$scope.click = function(e) { 
				crop.location = [e.offsetX - (crop.size[0] / 2), e.offsetY - (crop.size[1] / 2)];
			};

			$scope.setSource = function(source) { 
				$scope.currentSource = source;
				$scope.currentStep = 1;
			};

			$scope.takePhoto = function() {
				if ($scope.currentStream == null) return;

				$scope.hasPhoto = true;
				fullContext.drawImage(video, 0, 0, $scope.width, $scope.height);
				drawCropSpace();
				$scope.currentStep = 2;
			};

			$scope.$watch('currentStep', function(newValue, oldValue) {
				if (oldValue == 1 && $scope.currentStream) {
					//$scope.currentStream.stop();
				}
			});

			$scope.$watch('crop.location', function() {
				drawCropSpace();
			});

			var drawCropSpace = function() {
				if (!$scope.hasPhoto) return;

				var minX = 0,
					minY = 0,
					maxX = $scope.width - crop.size[0],
					maxY = $scope.height - crop.size[1];
					x = Math.max(minX, Math.min(maxX, crop.location[0])),
					y = Math.max(minY, Math.min(maxY, crop.location[1]));

				cropContext.drawImage(fullCanvas, 0, 0, $scope.width, $scope.height);
				cropContext.strokeStyle = '#f33';
				cropContext.strokeRect(x, y, crop.size[0], crop.size[1]);
				finalContext.drawImage(fullCanvas, x, y, crop.size[0], crop.size[1], 0, 0, finalWidth, finalHeight);
			};

			var loadSources = function() {
				MediaStreamTrack.getSources(function(sources) {
					var videoSources = 
						_.where(sources, {kind: 'video'})
						 .map(function(source, index) {
						 	return {
						 		id: source.id,
						 		label: source.label,
						 		facing: source.facing,
						 		name: source.label || source.facing || 'Camera #' + (index + 1)
						 	};
						});

					if ($scope.currentSource == null && videoSources.length > 0) {
						$scope.currentSource = videoSources[0];
					}

					$scope.videoSources = videoSources;
					$scope.$apply();
				});
			};
			loadSources();

			$scope.$watch('currentSource', function(source) {
				if ($scope.currentStream) {
					$scope.currentStream.stop();
				}
				$scope.currentStream = null;
				$scope.currentStreamUrl = null;
				$scope.hasPhoto = false;

				if (source == null || source.id == null) return;

				navigator.webkitGetUserMedia({video: {optional: [{sourceId: source.id}]}}, function(stream) {
					$scope.currentStream = stream;
					$scope.currentStreamUrl = $sce.trustAsResourceUrl(window.URL.createObjectURL(stream));
					$scope.$apply();
				}, function(err) {
					alert(err.name);
				});
			});
		}
	}
});