var angular = require('angular'),
	THREE = require('three'),
	Stats = require('stats'),
	_ = require('underscore');

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
				var height = window.innerHeight,
					width = window.innerWidth;
					
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
						width = 2,
						height = 2,
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