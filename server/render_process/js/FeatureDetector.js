/**
 * Created with IntelliJ IDEA.
 * User: Jake
 */

define([],
    function () {
        return (function () {
            /**
             * Creates a FeatureDetector object
             * @constructor
             */
            function FeatureDetector() {
            }


            FeatureDetector.isRunningInElectron = function () {
                if (window && window.process && window.process.type && window.process.versions) {
                    if (process.versions.hasOwnProperty('electron')) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            };

            //Return constructor
            return FeatureDetector;
        })();
    });
