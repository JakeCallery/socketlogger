
//Node requires
const util = require('util');
const os = require('os');
const fs = require('fs');
const exec = require('child_process').exec;
const spawn = require('child_process').spawn;

//Electron Requires
const electron = require('electron');
const ipcMain = electron.ipcMain;
const dialog = require('electron').dialog;
const app = electron.app;
let l = require('./Logger').logger;
l.level = 'debug';

//Set up electron
app.setName('SocketLogger');
oldUserData = app.getPath('userData');
newUserData = oldUserData.replace('Electron', 'SocketLogger');
app.setPath('userData', newUserData);
let appPaths = {
    userData:app.getPath('userData'),
};

//3rd party Requires
const jStorage = require('electron-json-storage');

//Custom Requires
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

l.debug("User Data Path: " + app.getPath('userData'));

//Setup Socket Manager
let sm = require('./SocketManager');

//Mange User Preferences
ipcMain.on('requestPrefs', function($e){
    jStorage.get('DeploymentWatcherPrefs', function($err, $data){
        if($err){
            l.error($err);
        }

        let prefsObj = $data;
        mainWindow.webContents.send('gotPrefs', prefsObj);
    });
});

ipcMain.on('savePrefs', function($e, $prefsObj){
    jStorage.set('DeploymentWatcherPrefs', $prefsObj, function($err){
        if(!$err){
            l.info('Saving User Preferences: ' + $prefsObj);
        } else {
            l.error('Error saving User Preferences: ' + $err);
        }

    });
});

//Manage App State
function handleAppReady() {
    // Create MAIN WINDOW
    mainWindow = new BrowserWindow(
        {
            width: 1024,
            height: 768,
            minWidth: 600,
            minHeight: 600,
            //icon: __dirname + '/../ansysicon.png'
        });

    //Test Shell Command
    l.debug('Resources Path: ' + process.resourcesPath);

    // and load the index.html of the app.
    mainWindow.loadURL(`file://${__dirname}/../render_process/index.html`);

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    });

    l.uiLoggerInstance.renderWindow = mainWindow;

    l.debug('Main Window Ready');

    sm.initServer();
    sm.on('newlogdata', ($e) => {
        l.debug('Main Caught New Log Data: ', $e);
        mainWindow.webContents.send('newlogdata', $e);
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', handleAppReady);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
});

