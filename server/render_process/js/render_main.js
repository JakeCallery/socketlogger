import L from 'jac/logger/Logger';
import VerboseLevel from 'jac/logger/VerboseLevel';
import LogLevel from 'jac/logger/LogLevel';
import ConsoleTarget from 'jac/logger/ConsoleTarget';
import FD from 'FeatureDetector';

L.addLogTarget(new ConsoleTarget());
L.verboseFilter = (VerboseLevel.NORMAL | VerboseLevel.TIME | VerboseLevel.LEVEL | VerboseLevel.LINE);
L.levelFilter = (LogLevel.DEBUG | LogLevel.INFO | LogLevel.WARNING | LogLevel.ERROR);
//L.debug('New Main!');
let mainObj = {};

if(FD.isRunningInElectron()){
    L.debug('Running Under Electron');
    mainObj.remote = nodeRequire('electron').remote;
    mainObj.dialog = mainObj.remote.dialog;
    mainObj.fs = nodeRequire('fs');
    mainObj.ipcRenderer = nodeRequire('electron').ipcRenderer;
    mainObj.clipboard = nodeRequire('electron').clipboard;
    //mainObj.remote.getCurrentWindow().toggleDevTools();
} else {
    L.log('Not Running Under Electron');
}

//Set up UI Manager
// let uiManager = new UIManager();
// L.addLogTarget(new UILogTarget(uiManager), true);
