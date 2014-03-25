var angular = require('angular'),
	THREE = require('three'),
	Stats = require('stats');

module.exports = function SceneDirective() {
	return {
		restrict: 'E',
		link: function($scope, element, attributes) {
			var width = window.innerWidth,
				height = window.innerHeight,
				scene = new THREE.Scene(),
				renderer = new THREE.WebGLRenderer({antialias: true}),
				stats = new Stats();

			element.append(renderer.domElement);
			element.append(stats.domElement);

			$scope.scene = scene;
			$scope.renderer = renderer;


			// camera = new facerace.DriveCamera(60, 1.0 /*width / height*/, 1, 5000, null, config.camera),


			// camera.up.set(0, 0, 1);

			scene.add(new THREE.AmbientLight(0xffffff));

			renderer.setSize(width, height);

			stats.domElement.style.position = 'absolute';
			stats.domElement.style.top = '0px';

			var resize = function() {
				var height = element.height(),
					width = element.width();
					
				renderer.setSize(width, height);
				// camera.aspect = width / height;
				// camera.updateProjectionMatrix();
			};

			window.addEventListener('resize', resize, false);
		}
	};
};