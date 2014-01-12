var faceraceClient = (function() {
	var create = function(url, element, controls) {
		element = $(element);
		
		var graphics = createScene(element),
			game = startGame(url, controls, graphics);

		return game;
	};

	var createScene = function(element) {
		var height = window.innerHeight,
			width = window.innerWidth,
			camera = new THREE.PerspectiveCamera(45, width / height, 1, 5000),
			scene = new THREE.Scene(),
			renderer = new THREE.WebGLRenderer({antialias: true}),
			stats = new Stats();

		camera.up.set(0, 0, 1);
		camera.position.z = 1000;
		camera.position.y = -100;

		scene.add(new THREE.AmbientLight(0xffffff));

		renderer.setSize(width, height);

		stats.domElement.style.position = 'absolute';
		stats.domElement.style.top = '0px';

		element.append(renderer.domElement);
		element.append(stats.domElement);

		var callback = function() {
			var height = window.innerHeight,
				width = window.innerWidth;
				
			renderer.setSize(width, height);
			camera.aspect = width / height;
			camera.updateProjectionMatrix();
		};
		window.addEventListener('resize', callback, false);

		return {
			camera: camera,
			scene: scene,
			renderer: renderer,
			stats: stats
		};
	};

	var startGame = function(url, controls, graphics) {
		var camera = graphics.camera,
			scene = graphics.scene,
			renderer = graphics.renderer,
			stats = graphics.stats,
			socket = io.connect(url, {reconnect: false})
			emit = function(name, data) { socket.emit(name, data); },
			game = {
				socket: socket,
				world: {
					players: []
				}
			},
			players = {},
			player = null, 
			playerID = null;

		emit('joinGame', {name: 'blake', image: '/images/faces/blake.png'});

		socket.on('welcome', function(data) {
			var world = data.world;
			
			game.world = world;

			playerID = data.playerID;
			playerIndex = world.playerMap[data.playerID];
			player = world.players[playerIndex];

			var course = createPlane(world.course.image, world.course.size[0], world.course.size[1]);
			course.position.set(50, 50, 0);
			course.up.set(1, 0, 0);
			scene.add(course);

			window.requestAnimationFrame(step);
		});

		socket.on('world', function(data) {
			var world = game.world,
				players = game.world.players,
				stars = game.world.stars;

			_.extend(world, data.world);
			
			_.each(data.world.players, function(player, index) {
				_.extend(players[index], player);
			});

			_.each(data.world.stars, function(star, index) {
				_.extend(stars[index], star);
			});

			var index = world.playerMap[data.playerID];
			if (index !== playerIndex) {
				playerIndex = index;
				player = players[playerIndex];			
			}
		});

		var step = function(timestamp) {
			var world = game.world,
				simulatorPlayers = world.players,
				stars = world.stars;

			sendControls();

			_.each(simulatorPlayers, updatePlayer);

			var target = players[playerID] || scene;

			if (typeof target.simulatorPlayer !== 'undefined') {
				var direction = new THREE.Vector3(Math.sin(target.simulatorPlayer.direction), Math.cos(target.simulatorPlayer.direction), 0);
				direction.normalize();
				direction.multiplyScalar(140);

				camera.position.copy(target.position);
				camera.position.sub(direction);
				camera.position.z = 100;
			}
			else {
				//graphics.camera.position.set(target.position.x, target.position.y, 1000);
			}

			camera.lookAt(target.position);
			renderer.render(scene, camera);

			stats.update();
			window.requestAnimationFrame(step);
		};
		
		var updatePlayer = function(simulatorPlayer) {
			var id = simulatorPlayer.id,
				player = players[id];
			
			if (!player) {
				player = createPlane(simulatorPlayer.face, 10, 10);
				player.rotateX(Math.PI / 2);
				scene.add(player);
				players[id] = player;
			}
			
			player.rotateY(simulatorPlayer.direction);
			player.position.set(simulatorPlayer.position[0], simulatorPlayer.position[1], simulatorPlayer.position[2]);

			player.simulatorPlayer = simulatorPlayer;

			return player;
		};

		var createPlane = function(imageUrl, width, height) {
			var map = THREE.ImageUtils.loadTexture(imageUrl),
				material = new THREE.MeshLambertMaterial({
					ambient: 0xffffff, map: map, side: THREE.DoubleSide
				});
				
			return new THREE.Mesh(new THREE.PlaneGeometry(width, height, 1, 1), material);
		};

		var sendControls = function() {
			emit('controls', {controls: controls});
		};
		game.controlsUpdated = sendControls;

		return game;
	};

    return create;
})();


var exports = exports || {};
exports.faceraceClient = faceraceClient;