/**
 * Created with IntelliJ IDEA.
 * User: Jake
 */

export default class FeatureDetector{
    constructor() {
    }

    static isRunningInElectron() {
        if (window && window.process && window.process.type && window.process.versions) {
            return (window.process.versions.hasOwnProperty('electron'));
        } else {
            return false;
        }
    };

}
