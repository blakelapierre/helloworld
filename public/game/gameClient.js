var faceraceClient = (function() {
	var create = function(url, element, controls, config) {
		element = $(element);
		config = config || {};

		setDefaults(config);
		
		var graphics = createScene(element, config),
			game = startGame(url, controls, graphics, config);

		return game;
	};

	var createScene = function(element, config) {
		var height = window.innerHeight,
			width = window.innerWidth,
			camera = new facerace.DriveCamera(90, width / height, 1, 5000, null, config.camera),
			scene = new THREE.Scene(),
			renderer = new THREE.WebGLRenderer({antialias: true}),
			stats = new Stats();


		camera.up.set(0, 0, 1);

		scene.add(new THREE.AmbientLight(0xffffff));

		renderer.setSize(width, height);

		stats.domElement.style.position = 'absolute';
		stats.domElement.style.top = '0px';

		element.append(renderer.domElement);
		element.append(stats.domElement);

		var resize = function() {
			var height = element.height(),
				width = element.width();
				
			renderer.setSize(width, height);
			camera.aspect = width / height;
			camera.updateProjectionMatrix();
		};
		window.addEventListener('resize', resize, false);

		return {
			camera: camera,
			scene: scene,
			renderer: renderer,
			stats: stats,
			resize: resize
		};
	};

	var startGame = function(url, controls, graphics, config) {
		var simulator = faceraceSimulator(20),
			camera = graphics.camera,
			scene = graphics.scene,
			renderer = graphics.renderer,
			stats = graphics.stats,
			particleGroup = graphics.particleGroup,
			socket = io.connect(url, {reconnect: false}),
			emit = function(name, data) { socket.emit(name, data); },
			game = {
				socket: socket,
				world: simulator.world
			},
			players = {},
			playerObjects = {},
			player = null, 
			playerID = null,
			playerIndex = null,
			oldControls = {};

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
			player = world.players[playerIndex];
			fire('playerMetrics', player);

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

		socket.on('controls', function(data) {
			var player = simulator.getPlayer(data.id);
			simulator.setPlayerControlsAtStep(player, data.controls, data.controls.step);			
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

			world.playerMap = sourceWorld.playerMap;

			_.each(sourceWorld.players, function(player, index) {
				var id = player.id,
					index = world.playerMap[id],
					p = players[index];

				if (p) {
					delete player.lastControlsUpdate; // ugly
					_.extend(p, player, {step: p.step });
					//console.log('step', p.id, p.step);
				}
				else {
					world.playerMap[id] = players.length;
					players.push(player);
				}
			});

			_.each(sourceWorld.stars, function(star, index) {
				_.extend(stars[index], star);
			});

			var index = world.playerMap[state.playerID];
			if (index !== playerIndex) {
				playerIndex = index;
				player = players[playerIndex];
				fire('playerMetrics', player);		
			}
		};

		var step = function(timestamp) {
			var world = simulator.world,
				simulatorPlayers = world.players,
				stars = world.stars;

			var index = world.playerMap[playerID];
			
			player = world.players[index];		
			
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
				camera.setTarget(target);
				camera.updateDriveCamera();
			}
			else {
				//graphics.camera.position.set(target.position.x, target.position.y, 1000);
			}
			
			renderer.render(scene, camera);

			stats.update();
			window.requestAnimationFrame(step);

			fire('frame');
		};
		
		var logs = 0;
		var updatePlayer = function(simulatorPlayer) {
			var id = simulatorPlayer.id,
				position = simulatorPlayer.position,
				pObject = playerObjects[id],
				targetZ = position[2];
			
			if (!pObject) {
				pObject = createPlayerObject(simulatorPlayer);
				pObject.rotateX(Math.PI / 2);
				scene.add(pObject);
				playerObjects[id] = pObject;
			}

			if (id === playerID) {
				pObject.position.set(position[0], position[1], position[2]);
			}
			else {
				pObject.targetPosition = new THREE.Vector3().fromArray(position);
				
				var oldPosition = pObject.position;

				pObject.position = pObject.targetPosition;
				pObject.position.lerp(oldPosition, 0.5);
			}
						
			pObject.position.z = targetZ + 5 + 5 * Math.sin(simulatorPlayer.step * 20 / 1000 * 2 * Math.PI / 5);

			pObject.rotation.y = -simulatorPlayer.direction;

			pObject.scale.set(simulatorPlayer.scale, simulatorPlayer.scale, simulatorPlayer.scale);

			pObject.simulatorPlayer = simulatorPlayer;

			pObject.particleGroup.tick(20 / 1000);

			return pObject;
		};

		var createPlayerObject = function(simulatorPlayer) {
			var pObject = createPlane(simulatorPlayer.face, 5, 5);

			pObject.particleGroup = new SPE.Group({
				texture: THREE.ImageUtils.loadTexture('/images/particles/smokeparticle.png'),
				maxAge: 3
			});

			pObject.particleGroup.addEmitter(new SPE.Emitter({
				type: 'cube',
				position: new THREE.Vector3(0, -1.5, 0),
				positionSpread: new THREE.Vector3(5, 0, 5),
				accelerationSpread: new THREE.Vector3(2, 0, 2),
				particlesPerSecond: 2,
				sizeStart: 8,
				sizeEnd: 24,
				opacityStart: 0.8,
				opacityEnd: 0,
				colorStart: new THREE.Color('black'),
				colorEnd: new THREE.Color('white')
			}));
			pObject.add(pObject.particleGroup.mesh);

			return pObject;
		};

		var createPlane = function(imageUrl, width, height) {
			var map = THREE.ImageUtils.loadTexture(imageUrl),
				material = new THREE.ShaderMaterial({
					fragmentShader: document.getElementById('plane-fragment-shader-swirl').textContent,
					vertexShader: document.getElementById('plane-vertex-shader-swirl').textContent,
					uniforms: {
						texture: {type: 't', value: map},
						width: {type: 'f', value: width},
						height: {type: 'f', value: height},
						radius: {type: 'f', value: 10},
						angle: {type: 'f', value: 0.8},
						center: {type: 'v2', value: new THREE.Vector2(width / 2, height / 2)}
					},
					transparent: false,
					side: THREE.DoubleSide
				});
				
			map.anisotropy = renderer.getMaxAnisotropy();
			return new THREE.Mesh(new THREE.PlaneGeometry(width, height, 1, 1), material);
		};

		var controlList = ['turn', 'up', 'down', 'left', 'right'];
		var sendControls = function() {
			var controlsChanged = function() {
				return !_.every(controlList, function(control) { return controls[control] == oldControls[control]; });
			};

			if (controlsChanged()) {
				emit('controls', {controls: controls});
				_.each(controlList, function(control) { oldControls[control] = controls[control]; });
			}
		};

		var setFace = function(data) {
			if (data) {
				emit('setFace', {image: data});
			}
		};

		var listeners = {},
			fire = function(name, data) {
				_.each(listeners[name] || [], function(listener) {
					listener(data, name);
				});
			},
			on = function(name, callback) {
				var l = listeners[name] || [];
				l.push(callback);
				listeners[name] = l;
			};

		_.extend(game, {
			controlsUpdated: sendControls,
			setFace: setFace,
			resize: graphics.resize,
			on: on
		});

		return game;
	};

	var setDefaults = function(config) {
		var camera = config.camera || {};
		camera.trailDistance = camera.trailDistance || 100;
		camera.heightFromGround = camera.heightFromGround || 30;
		camera.fov = camera.fov || 80;
		camera.offset = camera.offset || new THREE.Vector3(0, 0, 50);

		config.camera = camera;

	};

    return create;
})();

var clamp = function(value, min, max) {
  return Math.min(Math.max(value, min), max);
};

var exports = exports || {};
exports.faceraceClient = faceraceClient;