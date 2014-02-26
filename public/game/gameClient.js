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
			camera = new facerace.DriveCamera(60, 1.0 /*width / height*/, 1, 5000, null, config.camera),
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
		var simulator = faceraceSimulator(20, {isClient: true, logStates: false}),
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
			oldControls = {},
			startTime = new Date().getTime();

		var getWorld = function() { return simulator.world; };

		var measurements = 10,
			pong = function(latency) {
				
			};

		var adjustClock = function() {
			if (--measurements == 0) return;
		};

		var metrics = {latency: 0};

		emit('joinGame', {name: 'blake', image: '/images/faces/blake.png'});

		socket.on('update', simulator.worldControls.processUpdate);

		socket.on('welcome', function(data) {
			var sourceWorld = data.world,
				world = getWorld(),
				welcomeTime = new Date().getTime(),
				timeElapsed = data.currentTime - sourceWorld.state.start;
			
			console.log('game started', timeElapsed, welcomeTime, data);

			world.state.playerMap = sourceWorld.state.playerMap;
			_.each(sourceWorld.state.players, simulator.worldControls.addPlayer);

			world.state.step = world.state.predictStep = sourceWorld.state.step;
			world.state.start = welcomeTime - timeElapsed	+ 5;

			playerID = data.playerID;
			player = simulator.getPlayer(playerID);
			playerIndex = sourceWorld.state.playerMap[data.playerID];
			
			metrics.player = player;
			metrics.world = world;
			fire('metrics', metrics);

			player.controls = controls;

			var course = createPlane(sourceWorld.state.course.image, sourceWorld.state.course.size[0], sourceWorld.state.course.size[1]);
			course.position.set(50, 50, 0);
			course.up.set(1, 0, 0);
			scene.add(course);

			showMessage('Welcome to Face Race!');

			adjustClock();

			window.requestAnimationFrame(step);
		});

		socket.on('world', function(data) {
			processNewState(data);
		});

		socket.on('newPlayer', function(data) {
			console.log('newplayer', data);
			simulator.addPlayer(data.player);
			showMessage(data.player.name + ' Joined the Race!');
		});

		socket.on('faceChange', function(data) {
			console.log('facechange', data);
				//changeTexture(pObject, simulatorPlayer.face);
			var map = THREE.ImageUtils.loadTexture(data.face),
				pObject = playerObjects[data.playerID];
			pObject.material.uniforms.texture.value = map;
		});

		var pingStart = 0;
			pong = function() {};

		socket.on('ping', function() {
			emit('pong', {time: new Date().getTime()});
		});

		socket.on('pong', function(data) {
			var now = new Date().getTime(),
				latency = now - pingStart,
				difference = now - data.time - latency;

			metrics.latency = latency;

			pong(latency);
			setTimeout(ping, 1000);
		});

		var ping = function() {
			pingStart = new Date().getTime();
			emit('ping');
			return pingStart;
		};

		var processNewState = function(state) {
			var sourceWorld = state.world;
				world = getWorld(),
				players = world.state.players,
				stars = world.state.course.stars;

			world.state.playerMap = sourceWorld.state.playerMap;

			_.each(sourceWorld.state.players, function(sourcePlayer, index) {
				var id = sourcePlayer.id,
					localPlayer = simulator.getPlayer(id);

				if (id == player.id) return;

				if (localPlayer) {
					//delete sourcePlayer.lastControlsUpdate; // ugly
					// _.extend(localPlayer, _.omit(sourcePlayer, 'lastControlsUpdate'), {step: localPlayer.step });
					_.extend(localPlayer.state, _.omit(sourcePlayer.state, 'lastControlsUpdate'));
				}
				else {
					alert('error, bad player!');
				}
			});

			_.each(sourceWorld.state.course.stars, function(star, index) {
				_.extend(stars[index], star);
			});

		};

		var leftCount = 0,
			rightCount = 0,
			maxCount = 20;
		var step = function(timestamp) {
			var world = simulator.world,
				simulatorPlayers = world.state.players,
				stars = world.state.course.stars;

			if (controls.left) {
				if (leftCount < maxCount) leftCount++;
				controls.turn = controls.baseTurn * (1 + (leftCount / maxCount));
			}
			else leftCount = 0;
			if (controls.right) {
				if (rightCount < maxCount) rightCount++;
				controls.turn = controls.baseTurn * (1 + (rightCount / maxCount));
			}
			else rightCount = 0;

			sendControls();

			simulator.runWorldToNow();

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

			fire('tick', world.state.predictStep);
		};
		
		var logs = 0;
		var updatePlayer = function(simulatorPlayer) {
			var id = simulatorPlayer.id,
				state = simulatorPlayer.prediction,
				metrics = state.metrics,
				position = metrics.position,
				pObject = playerObjects[id],
				targetZ = position[2];
			
			position[0] = position[0] || 0;
			position[1] = position[1] || 0;
			position[2] = position[2] || 0;

			if (!pObject) {
				pObject = createPlayerObject(simulatorPlayer);
				
				pObject.position.set(position[0], position[1], position[2]);
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
						
			//pObject.position.z = targetZ + 5 + 5 * Math.sin(simulatorPlayer.step * 20 / 1000 * 2 * Math.PI / 5);

			pObject.rotation.y = -metrics.direction;

			pObject.scale.set(simulatorPlayer.scale, simulatorPlayer.scale, simulatorPlayer.scale);

			pObject.simulatorPlayer = simulatorPlayer;

			pObject.particleGroup.tick(20 / 1000);

			pObject.material.uniforms.time.value += 1;

			return pObject;
		};

		var createPlayerObject = function(simulatorPlayer) {
			var pObject = createPlane(simulatorPlayer.face, 5, 5, true);

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

		var createPlane = function(imageUrl, width, height, swirl) {
			swirl = swirl ? '-swirl' : '';
			var map = THREE.ImageUtils.loadTexture(imageUrl),
				material = new THREE.ShaderMaterial({
					fragmentShader: document.getElementById('plane-fragment-shader' + swirl).textContent,
					vertexShader: document.getElementById('plane-vertex-shader' + swirl).textContent,
					uniforms: {
						texture: {type: 't', value: map},
						width: {type: 'f', value: width},
						height: {type: 'f', value: height},
						radius: {type: 'f', value: 10},
						angle: {type: 'f', value: 0.8},
						center: {type: 'v2', value: new THREE.Vector2(width / 2, height / 2)},
						time: {type: 'f', value: 1.0}
					},
					side: THREE.DoubleSide
				}),
				mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height, 1, 1), material);
				
			map.anisotropy = renderer.getMaxAnisotropy();
			mesh._imageUrl = imageUrl;
			return mesh;
		};

		var controlList = ['turn', 'up', 'down', 'left', 'right', 'space'];
		var sendControls = function() {
			var controlsChanged = function() {
				return !_.every(controlList, function(control) { 
					return controls[control] === oldControls[control];
				});
			};

			controls.step = simulator.world.state.predictStep + 1;
			simulator.worldControls.addEvent(simulator.world.state.predictStep + 1, {type: 'controls', id: playerID, controls: controls});

			//if (controlsChanged()) {
				controls.step = game.world.state.predictStep + 1;
				emit('controls', {controls: controls});
				_.each(controlList, function(control) { oldControls[control] = controls[control]; });
			//}
		};

		var setFace = function(data) {
			if (data) {
				emit('setFace', {image: data});
			}
		};

		var showMessage = function(message) {
			fire('message', message);
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
		camera.trailDistance = camera.trailDistance || 50;
		camera.heightFromGround = camera.heightFromGround || 25;
		camera.fov = camera.fov || 60;
		camera.offset = camera.offset || new THREE.Vector3(0, 0, 20);

		config.camera = camera;

	};

    return create;
})();

var clamp = function(value, min, max) {
  return Math.min(Math.max(value, min), max);
};

var exports = exports || {};
exports.faceraceClient = faceraceClient;