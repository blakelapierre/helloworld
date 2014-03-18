angular.module('facerace')
    .directive('messageArea', function() {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: '/js/facerace/hud/messageArea.html',
            require: '^facerace',
            link: function($scope, element, attributes, facerace) {
                var cls = 'message-fade';

                facerace.setMessageFn(function(message) {
                    element.removeClass(cls);
                    $scope.message = message;
                    setTimeout(function() {
                        element.addClass(cls);
                    }, 0);
                });
            }
        };
    });
