angular.module('facerace')
    .directive('playerController', function() {
        return {
            require: '^facerace',
            link: function($scope, element, attribute, facerace) {
                var controls = $scope.controls;
                console.log('playercontroller', facerace, controls);

                var keymap = {
                    // tab
                    9: function(b) {
                        $scope.infoVisible = b && !$scope.infoVisible || !b && $scope.infoVisible;
                    },
                    // space
                    32: function(b) {
                        controls.space = b;
                    },
                    // left arrow
                    37: function(b) {
                        controls.left = b;
                        setTurn();
                    },
                    // up arrow
                    38: function(b) {
                        controls.up = b;
                    },
                    // right arrow
                    39: function(b) {
                        controls.right = b;
                        setTurn();
                    },
                    // down arrow
                    40: function(b) {
                        controls.down = b;
                    },
                    // c
                    67: function(b) {
                        $scope.configVisible = b && !$scope.configVisible || !b && $scope.configVisible;
                    }
                };

                keymap[65] = keymap[37]; // a
                keymap[87] = keymap[38]; // w
                keymap[68] = keymap[39]; // d
                keymap[83] = keymap[40]; // s

                var setTurn = function() {
                    var turn = 0;
                    if (controls.left) turn -= Math.PI / 12;
                    if (controls.right) turn += Math.PI / 12;
                    controls.turn = turn;
                    controls.baseTurn = turn;
                    controls.quaternion = [0, 0, Math.sin(turn), Math.cos(turn)];
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
    });
