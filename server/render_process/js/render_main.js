define([
        'libs/domReady!',
        'jac/logger/Logger',
        'jac/logger/VerboseLevel',
        'jac/logger/LogLevel',
        'jac/logger/ConsoleTarget',
        'FeatureDetector',
        'UIManager',
        'UILogTarget'
    ],
    function (DOC, L, VerboseLevel, LogLevel, ConsoleTarget, FD, UIManager, UILogTarget) {
        return function () {

            L.addLogTarget(new ConsoleTarget());
            L.verboseFilter = (VerboseLevel.NORMAL | VerboseLevel.TIME | VerboseLevel.LEVEL | VerboseLevel.LINE);
            L.levelFilter = (LogLevel.DEBUG | LogLevel.INFO | LogLevel.WARNING | LogLevel.ERROR);
            //L.debug('New Main!');
            let mainObj = {};

            if(FD.isRunningInElectron()){
                L.debug('Running Under Election');
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
            let uiManager = new UIManager();
            L.addLogTarget(new UILogTarget(uiManager), true);
        }();
    }
);