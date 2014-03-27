(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var angular = (window.angular);

module.exports = angular.module('facerace', [])
	.directive('facerace', require('./faceraceDirective'))
	.directive('scene', require('./scene/sceneDirective'))
	.directive('inputs', require('./inputsDirective'));
},{"./faceraceDirective":2,"./inputsDirective":4,"./scene/sceneDirective":5}],2:[function(require,module,exports){
var angular = (window.angular);

module.exports = function FaceraceDirective () {
	return {
		restrict: 'E',
		template: require('./faceraceTemplate.html'),
		link: function($scope, element, attributes) { },
		controller:  ['$scope', function($scope) {
		}]
	};
};
},{"./faceraceTemplate.html":3}],3:[function(require,module,exports){
module.exports = '<scene></scene>\n<inputs></inputs>';
},{}],4:[function(require,module,exports){
var angular = (window.angular),
	_ = (window._);

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
				_.each(stream.audioTracks, function(track) { track.enabled = false; });
				$scope.sources[video.socketID] = video;
				$scope.$apply();
			});

			window.addEventListener('hashchange', function(e) {
				window.location.reload(true);
			});

			var room = window.location.hash || '#facerace';
			rtc.connect('ws://' + window.location.hostname + ':3007', room);
			$scope.room = room;

			rtc.on('add remote stream', function(stream, socketID) {
				var video = createVideo(stream, socketID);
				$scope.sources[video.socketID] = video;
				$scope.$apply();
			});

			rtc.on('disconnect stream', function(socketID) {
				delete $scope.sources[socketID];
				$scope.$apply();
			});
		}
	};	
};
},{}],5:[function(require,module,exports){
var angular = (window.angular),
	THREE = (window.THREE),
	Stats = (window.Stats),
	_ = (window._);

module.exports = function SceneDirective() {
	return {
		restrict: 'E',
		template: require('./sceneTemplate.html'),
		link: function($scope, element, attributes) {
			var width = window.innerWidth,
				height = window.innerHeight,
				scene = new THREE.Scene(),
				renderer = new THREE.WebGLRenderer({antialias: true}),
				camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000),
				// camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, 1, 1000 ), // play around with this some more
				stats = new Stats();

			element.append(renderer.domElement);
			element.append(stats.domElement);

			$scope.scene = scene;
			$scope.renderer = renderer;


			camera.up.set(0, 1, 0);
			camera.position.z = 10;

			scene.add(new THREE.AmbientLight(0xffffff));

			renderer.setSize(width, height);

			angular.element(renderer.domElement).css({
				position: 'absolute',
				top: '0px',
				left: '0px',
				width: '100%',
				height: '100%',
				overflow: 'hidden'
			});

			stats.domElement.style.position = 'absolute';
			stats.domElement.style.top = '0px';

			var resize = function(e) {
				console.log('resize', e, element);
				var height = e.target.innerHeight,
					width = e.target.innerWidth;
					
				renderer.setSize(width, height);
				camera.aspect = width / height;
				camera.updateProjectionMatrix();
			};

			window.addEventListener('resize', resize, false);

			$scope.liveSources = {};
			$scope.$watchCollection('sources', function(newValue, ALSONEWVALUEಠ_ಠ, $scope) {
				console.log('sources',newValue);
				var liveSources = $scope.liveSources,
					currentKeys = _.keys(newValue),
					oldKeys = _.keys(liveSources),
					newKeys = _.difference(currentKeys, oldKeys),
					removableKeys = _.difference(oldKeys, currentKeys);

				console.log(currentKeys, oldKeys, newKeys, removableKeys);	

				_.each(newKeys, function(newKey) {
					console.log(newKey);
					var videoSource = newValue[newKey],
						video = videoSource.element,
						width = 1,
						height = 1,
						texture = new THREE.Texture(video), 
						material = new THREE.ShaderMaterial({
							fragmentShader: document.getElementById('plane-fragment-shader-swirl').textContent,
							vertexShader: document.getElementById('plane-vertex-shader-swirl').textContent,
							uniforms: {
								texture: {type: 't', value: texture},
								width: {type: 'f', value: width},
								height: {type: 'f', value: height}
							},
							side: THREE.DoubleSide
						}),
						mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height, 1, 1), material);
						
					texture.anisotropy = renderer.getMaxAnisotropy();

					scene.add(mesh);

					videoSource.mesh = mesh;
					videoSource.texture = texture;
					liveSources[newKey] = videoSource;
				});

				_.each(removableKeys, function(removableKey) {
					var videoSource = liveSources[removableKey];
					scene.remove(videoSource.mesh);
					delete liveSources[removableKey];
				});

				var i = 0;
				_.each(liveSources, function(videoSource) {
					var mesh = videoSource.mesh;
					mesh.position.y = i;
					mesh.position.x = i;
					i++;
				});
			}, true);

			var render = function() {
				window.requestAnimationFrame(render);

				var source = $scope.liveSources['local'];
				if (source && source.mesh) camera.lookAt(source.mesh.position);

				_.each(_.pairs($scope.liveSources), function(pair) {
					var source = pair[1],
						element = source.element;
					if (element.readyState == element.HAVE_ENOUGH_DATA) {
						source.texture.needsUpdate = true;
					}
				});

				renderer.render(scene, camera);
				stats.update();
			};
			window.requestAnimationFrame(render);
		}
	};
};
},{"./sceneTemplate.html":6}],6:[function(require,module,exports){
module.exports = '<span class="room-name">{{room}}</span>\n<script id="plane-vertex-shader" type="x-shader/x-vertex">\n	varying vec2 vUv;\n\n	void main()\n	{\n	    vUv = uv;\n	    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n	}\n</script>\n\n<script id="plane-fragment-shader" type="x-shader/x-fragment">\n	#ifdef GL_ES\n	precision highp float;\n	#endif\n\n	uniform sampler2D texture;\n	uniform float width;\n	uniform float height;\n	varying vec2 vUv;\n\n	void main(void)\n	{\n		vec2 position = vUv;\n\n		float midX = width / 2.0;\n		float midY = height / 2.0;\n\n		vec4 color = texture2D(texture, position);\n\n		color[3] = position[0] / width;\n\n		gl_FragColor = color;\n	}\n</script>\n\n<script id="plane-vertex-shader-swirl" type="x-shader/x-vertex">\n	varying vec2 vUv;\n\n	void main()\n	{\n		vUv = uv;\n		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n	}\n</script>\n\n<script id="plane-fragment-shader-swirl" type="x-shader/x-fragment">\n	// Scene buffer\n	uniform sampler2D texture; \n\n	uniform float time;\n\n	uniform float width;\n	uniform float height;\n\n	// Swirl effect parameters\n	uniform float radius;\n	uniform float angle;\n	uniform vec2 center;\n\n	varying vec2 vUv;\n\n	vec4 PostFX(sampler2D texture, vec2 uv, float time)\n	{\n		vec2 texSize = vec2(width, height);\n		vec2 tc = uv * texSize;\n		tc -= center;\n		float dist = length(tc) * 1.5 * sin(time / 70.0);\n		if (dist < radius) \n		{\n			float percent = (radius - dist) / radius;\n			float theta = percent * percent * angle * 8.0;\n			float s = sin(theta);\n			float c = cos(theta);\n			tc = vec2(dot(tc, vec2(c, -s)), dot(tc, vec2(s, c)));\n		}\n		tc += center;\n		vec3 color = texture2D(texture, tc / texSize).rgb;\n		return vec4(color, 1.0);\n	}\n\n	void main (void)\n	{\n		gl_FragColor = PostFX(texture, vUv, time);\n	}\n</script>';
},{}]},{},[1])