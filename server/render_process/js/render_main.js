import L from 'jac/logger/Logger';
import VerboseLevel from 'jac/logger/VerboseLevel';
import LogLevel from 'jac/logger/LogLevel';
import ConsoleTarget from 'jac/logger/ConsoleTarget';
import FD from 'FeatureDetector';
import whenDomReady from 'when-dom-ready';
import UIManager from 'UIManager';
import UILogTarget from 'UILogTarget';

//Import through loaders
import '../css/main.css';

L.addLogTarget(new ConsoleTarget());

L.verboseFilter = (VerboseLevel.NORMAL | VerboseLevel.TIME | VerboseLevel.LEVEL | VerboseLevel.LINE);
L.levelFilter = (LogLevel.DEBUG | LogLevel.INFO | LogLevel.WARNING | LogLevel.ERROR);
L.debug('New Render Main!');

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

let uiManager = new UIManager(document);
L.addLogTarget(new UILogTarget(uiManager), true);

//Set up UI Manager
whenDomReady()
    .then(() => {
        uiManager.init();
    });
