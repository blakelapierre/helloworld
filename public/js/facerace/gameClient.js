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
			camera = new THREE.PerspectiveCamera(90, width / height, 1, 5000),
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
		var simulator = faceraceSimulator(20),
			camera = graphics.camera,
			scene = graphics.scene,
			renderer = graphics.renderer,
			stats = graphics.stats,
			socket = io.connect(url, {reconnect: false})
			emit = function(name, data) { socket.emit(name, data); },
			game = {
				socket: socket,
				world: simulator.world
			},
			players = {},
			player = null, 
			playerID = null,
			playerIndex = null;

		var getWorld = function() { return simulator.world; };

		game.world.startTime -= 500;

		emit('joinGame', {name: 'blake', image: '/images/faces/blake.png'});

		socket.on('welcome', function(data) {
			var sourceWorld = data.world,
				world = getWorld();
			
			world.playerMap = sourceWorld.playerMap;
			_.each(sourceWorld.players, function(p) {
				world.players.push(p);
			});

			world.step = sourceWorld.step;
			world.startTime = sourceWorld.startTime;

			playerID = data.playerID;
			playerIndex = sourceWorld.playerMap[data.playerID];
			player = sourceWorld.players[playerIndex];

			player.controls = controls;

			var course = createPlane(sourceWorld.course.image, sourceWorld.course.size[0], sourceWorld.course.size[1]);
			course.position.set(50, 50, 0);
			course.up.set(1, 0, 0);
			scene.add(course);

			window.requestAnimationFrame(step);
		});

		socket.on('world', function(data) {
			processNewState(data);
		});

		var pingStart = 0;
		socket.on('ping', function() {
			emit('pong', {time: new Date().getTime()});
		});

		socket.on('pong', function(data) {
			var now = new Date().getTime(),
				latency = now - pingStart,
				difference = now - data.time - latency;

			setTimeout(ping, 1000);
			console.log('latency', latency, difference);
		});

		var ping = function() {
			pingStart = new Date().getTime();
			emit('ping');
		};

		var processNewState = function(state) {
			var sourceWorld = state.world;
				world = getWorld(),
				players = world.players,
				stars = world.stars;

			world.step = sourceWorld.step;
			world.startTime = sourceWorld.startTime;

			//_.extend(world, state.world);
			//console.log('player step', player.step, 'world step', state.world.players[0].step);

			_.each(sourceWorld.players, function(player) {
				var id = player.id,
					p = players[id];
				if (p) _.extend(players[id], player);
				else players[id] = player;
			});

			_.each(sourceWorld.stars, function(star, index) {
				_.extend(stars[index], star);
			});

			var index = world.playerMap[state.playerID];
			if (index !== playerIndex) {
				playerIndex = index;
				player = players[playerIndex];			
			}
		};

		var step = function(timestamp) {
			var world = simulator.world,
				simulatorPlayers = world.players,
				stars = world.stars;

			player.controls = controls;
			sendControls();

			//simulator.runSimulationToNow();
			simulator.runWorldToNow();
			world = simulator.world;

			_.each(simulatorPlayers, updatePlayer);

			var target = players[playerID] || scene;

			if (typeof target.simulatorPlayer !== 'undefined') {
				var d = target.simulatorPlayer.direction,
					direction = new THREE.Vector3(Math.sin(d), Math.cos(d), 0),
					speed = new THREE.Vector3().fromArray(target.simulatorPlayer.velocity).length();

				direction.normalize();
				direction.multiplyScalar(40 - (speed / 60));

				camera.position.copy(target.position);
				camera.position.sub(direction);
				camera.position.z = 30 - (speed / 60);

				camera.up.x = target.simulatorPlayer.lastTurn[0] * 2;
				camera.up.y = target.simulatorPlayer.lastTurn[1] * 2;
				camera.up.z = 1;
				camera.up.normalize();
				
				camera.fov = 70 + (speed / 60);

				camera.updateProjectionMatrix();
			}
			else {
				//graphics.camera.position.set(target.position.x, target.position.y, 1000);
			}



			camera.lookAt(target.position);
			renderer.render(scene, camera);

			stats.update();
			window.requestAnimationFrame(step);
		};
		
		var logs = 0;
		var updatePlayer = function(simulatorPlayer) {
			var id = simulatorPlayer.id,
				player = players[id];
			
			if (!player) {
				player = createPlane(simulatorPlayer.face, 5, 5);
				player.rotateX(Math.PI / 2);
				scene.add(player);
				players[id] = player;
			}

			if (id === playerID) {
				player.position.set(simulatorPlayer.position[0], simulatorPlayer.position[1], simulatorPlayer.position[2]);
				player.rotation.y = -simulatorPlayer.direction;
				//console.log(player.position);
			}
			else {
				player.targetPosition = new THREE.Vector3().fromArray(simulatorPlayer.position);
				
				var oldPosition = player.position;
				player.position = player.targetPosition;
				player.position.lerp(oldPosition, 0.5);
			}
			
			//if (logs++ < 100) console.log(simulatorPlayer.controls, simulatorPlayer.direction);
			player.rotation.y = -simulatorPlayer.direction;

			
			//console.log(player.position, player.targetPosition);

			player.scale.set(simulatorPlayer.scale, simulatorPlayer.scale, simulatorPlayer.scale);

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