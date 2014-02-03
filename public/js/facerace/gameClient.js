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
			playerObjects = {},
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

			world.startTime = sourceWorld.startTime;

			_.each(sourceWorld.players, function(player) {
				var id = player.id,
					p = players[id];

				if (p) {
					delete player.lastControlsUpdate; // ugly
					_.extend(p, player, {step: p.step });
				}
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

			var index = world.playerMap[playerID];
			
			player = world.players[playerIndex];		
			
			simulator.setPlayerControls(player, controls);
			sendControls();

			simulator.runWorldToNow();

			var index = world.playerMap[playerID];
			if (index !== playerIndex) {
				playerIndex = index;
				player = world.players[playerIndex];			
			}

			_.each(simulatorPlayers, updatePlayer);

			var target = playerObjects[playerID] || scene;

			if (typeof target.simulatorPlayer !== 'undefined') {
				var d = target.simulatorPlayer.direction,
					direction = new THREE.Vector3(Math.sin(d), Math.cos(d), 0),
					speed = new THREE.Vector3().fromArray(target.simulatorPlayer.velocity).length();

				direction.normalize();
				direction.multiplyScalar(20 + (speed / 30));

				camera.position.copy(target.position);
				camera.position.sub(direction);
				camera.position.z = 20 + (speed / 60);
//console.log('last turn', target.simulatorPlayer.lastTurn);
				//camera.up.lerp(new THREE.Vector3().fromArray([target.simulatorPlayer.lastTurn[0] * 10, target.simulatorPlayer.lastTurn[1] * 10, 1]), 0.9);
				//console.log('cbefore', camera.up);
				camera.lookAt(target.position);
				//camera.up.x = Math.sin(controls.turn * Math.PI / 180);
				//camera.up.y = Math.cos(controls.turn * Math.PI / 180);
				//camera.up.x = 0.5;
				//camera.up.y = 0.5;
				//camera.up.z = 1;
				//camera.up.normalize();
				//camera.up.set(0, 0, 1);

				var lastZRotation = camera.lastZRotation || 0,
					diff = lastZRotation - controls.turn;
				
				var turn = -clamp(controls.turn, -1, 1),
					angle = turn / 90 * Math.PI;

				camera.quaternion.multiply(new THREE.Quaternion(0, 0, Math.sin(angle), Math.cos(angle)));
				//camera.quaternion.slerp(new THREE.Quaternion(0, 1, 0, (controls.turn / 90 * Math.PI)), 0.5);
				//camera.quaternion.multiplyQuaternions(new THREE.Quaternion(0, 0, 1, (controls.turn / 180 * Math.PI) / 2), camera.quaternion);
				//camera.quaternion.set(0, 1, 1, controls.turn / 180 * Math.PI);


				//console.log('camera', camera.up);
				
				camera.fov = 80 + (speed / 60);

				camera.updateProjectionMatrix();
			}
			else {
				//graphics.camera.position.set(target.position.x, target.position.y, 1000);
			}

			
			renderer.render(scene, camera);

			stats.update();
			window.requestAnimationFrame(step);
		};
		
		var logs = 0;
		var updatePlayer = function(simulatorPlayer) {
			var id = simulatorPlayer.id,
				pObject = playerObjects[id];
			
			if (!pObject) {
				pObject = createPlane(simulatorPlayer.face, 5, 5);
				pObject.rotateX(Math.PI / 2);
				scene.add(pObject);
				playerObjects[id] = pObject;
			}

			if (id === playerID) {
				pObject.position.set(simulatorPlayer.position[0], simulatorPlayer.position[1], simulatorPlayer.position[2]);
			//	pObject.rotation.y = -simulatorPlayer.direction;
				//console.log(pObject.position);
			}
			else {
				pObject.targetPosition = new THREE.Vector3().fromArray(simulatorPlayer.position);
				
				var oldPosition = pObject.position;
				pObject.position = pObject.targetPosition;
				pObject.position.lerp(oldPosition, 0.5);
			}
			
			
			pObject.rotation.y = -simulatorPlayer.direction;

			
			//console.log(pObject.position, pObject.targetPosition);

			pObject.scale.set(simulatorPlayer.scale, simulatorPlayer.scale, simulatorPlayer.scale);

			pObject.simulatorPlayer = simulatorPlayer;

			return pObject;
		};

		var createPlane = function(imageUrl, width, height) {
			var map = THREE.ImageUtils.loadTexture(imageUrl),
				material = new THREE.MeshLambertMaterial({
					ambient: 0xffffff, map: map, side: THREE.DoubleSide
				});
				
			map.anisotropy = renderer.getMaxAnisotropy();
			return new THREE.Mesh(new THREE.PlaneGeometry(width, height, 1, 1), material);
		};

		var sendControls = function() {
			emit('controls', {controls: controls});
		};
		game.controlsUpdated = sendControls;

		var setFace = function(data) {
			if (data) {
				emit('setFace', {image: data});
			}
		};
		game.setFace = setFace;

		return game;
	};

    return create;
})();

var clamp = function(value, min, max) {
  return Math.min(Math.max(value, min), max);
};


var exports = exports || {};
exports.faceraceClient = faceraceClient;