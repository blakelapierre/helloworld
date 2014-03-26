var angular = require('angular'),
	THREE = require('three'),
	Stats = require('stats');

module.exports = function SceneDirective() {
	return {
		restrict: 'E',
		template: require('./sceneTemplate.html'),
		link: function($scope, element, attributes) {
			var width = window.innerWidth,
				height = window.innerHeight,
				scene = new THREE.Scene(),
				renderer = new THREE.WebGLRenderer({antialias: true}),
				camera = new THREE.PerspectiveCamera(60, width / height, 1, 5000),
				stats = new Stats();

			element.append(renderer.domElement);
			element.append(stats.domElement);

			$scope.scene = scene;
			$scope.renderer = renderer;


			camera.up.set(0, 0, 1);

			scene.add(new THREE.AmbientLight(0xffffff));

			renderer.setSize(width, height);

			stats.domElement.style.position = 'absolute';
			stats.domElement.style.top = '0px';

			var resize = function() {
				var height = element.innerHeight,
					width = element.innerWidth;
					
				renderer.setSize(width, height);
				camera.aspect = width / height;
				camera.updateProjectionMatrix();
			};

			window.addEventListener('resize', resize, false);

			$scope.$watchCollection('sources', function(newValue, oldValue, whatareyou) {
				console.log('newValue', newValue);
				console.log('oldValue', oldValue);
				console.log('other', whatareyou);
			});

			// $scope.$watchCollection('videoSources', function(currentPeers, oldPeers) {
			// 	var checked = {};

			// 	_.each(currentPeers, function(peer) {
			// 		if (peer.object3D == null) {
			// 			var width = 1,
			// 				height = 1,
			// 				peerVideo = document.getElementById(peer.elementID),
			// 				texture = new THREE.Texture(peerVideo), 
			// 				material = new THREE.ShaderMaterial({
			// 					fragmentShader: document.getElementById('plane-fragment-shader').textContent,
			// 					vertexShader: document.getElementById('plane-vertex-shader').textContent,
			// 					uniforms: {
			// 						texture: {type: 't', value: texture},
			// 						width: {type: 'f', value: width},
			// 						height: {type: 'f', value: height}
			// 					},
			// 					side: THREE.DoubleSide
			// 				}),
			// 				mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height, 1, 1), material);
							
			// 			texture.anisotropy = renderer.getMaxAnisotropy();

			// 			mesh.position.z = -10;
			// 			scene.add(mesh);
			// 			camera.lookAt(mesh);

			// 			peer.object3D = {
			// 				peerVideo: peerVideo,
			// 				texture: texture,
			// 				mesh: mesh
			// 			};
			// 		}
			// 	});
			// });

			var render = function() {
				_.each($scope.peers, function(peer) {
					if (peer.object3D && peer.object3D.peerVideo.readyState == peer.object3D.peerVideo.HAVE_ENOUGH_DATA) {
						peer.object3D.texture.needsUpdate = true;
					}
				});
				renderer.render(scene, camera);
				stats.update();
				window.requestAnimationFrame(render);
			};
			window.requestAnimationFrame(render);
		}
	};
};