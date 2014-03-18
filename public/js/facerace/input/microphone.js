angular.module('facerace')
    .directive('microphone', function(userMediaService) {
        return {
            templateUrl: '/js/facerace/input/microphone.html',
            restrict: 'E',
            replace: true,
            scope: {
                showMicrophone: '='
            },
            link: function($scope, element, attributes) {
                $scope.record = function() {
                    var recorder = $scope.recorder;
                    recorder.clear();
                    recorder.record();
                    setTimeout(function() {
                        console.log('recording stopped');
                        recorder.stop();
                        recorder.exportWAV(function(blob) {
                            Recorder.forceDownload(blob);
                        });
                    }, 1000);
                }
            },
            controller: function($scope) {
                userMediaService.getAudioSources(function(sources) {
                    $scope.sources = sources;
                    userMediaService.getRecorder(sources[0].id, function(recorder) {
                        $scope.recorder = recorder;
                    }, function(error) {
                        alert(error);
                    });
                });
            }
        };
    });
