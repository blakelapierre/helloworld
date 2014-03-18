angular.module('faceraceDebug', [])
    .directive('objectEditor', function() {
        return {
            template: '<div class="object-editor"></div>',
            scope: {
                object: '='
            },

            link: function($scope, element, attributes) {
                var editor = new jsoneditor.JSONEditor(element[0], {
                    mode: 'tree',
                    change: function() {
                        updateObject($scope.object, editor.get());
                        $scope.$apply();
                    }
                });

                var updateObject = function(obj, from, key) {
                    if (key) {
                        var oldValue = obj[key],
                            newValue = from[key];

                        if (newValue == null) return;

                        if (_.isArray(newValue)) {
                            if (oldValue.length != newValue.length) throw "obj.length must equal from.length!";

                            for (var i = 0; i < obj.length; i++) {
                                updateObject(oldValue, newValue, i);
                            }
                        } else if (_.isObject(newValue)) {
                            for (var key in oldValue) {
                                updateObject(oldValue, newValue, key);
                            }
                        } else {
                            obj[key] = newValue;
                        }
                    } else {
                        for (var key in obj) {
                            updateObject(obj, from, key);
                        }
                    }
                };

                var updateEditor = function(node, obj) {
                    if (node.type == 'object' || node.type == 'array') {
                        for (var i = 0; i < node.childs.length; i++) {
                            var child = node.childs[i];
                            updateEditor(child, obj == null ? null : obj[child.field || child.index]);
                        }
                    } else {
                        node.updateValue(obj);
                    }
                };

                var interval = null;
                $scope.$watch('object', function() {
                    editor.set($scope.object);

                    if (interval) clearInterval(interval);
                    if ($scope.object) {
                        setInterval(function() {
                            updateEditor(editor.node, $scope.object);
                        }, 2000);
                    }
                });
            }
        };
    });
