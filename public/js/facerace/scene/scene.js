angular.module('facerace')
    .directive('scene', function() {
        return {
            require: '^facerace',
            link: function($scope, element, attribute, facerace) {
                facerace.setClient(faceraceClient('http://' + window.location.host, element, $scope.controls, $scope.config));
            }
        };
    });
