
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

//Get Environment Location
const AEC_ENV = process.env.AEC_ENV;
const NAT_IP = process.env.AEC_NAT_IP;
const AEC_SGE_IP = (process.env.AEC_SGE_IP || '10.220.130.30');
const AEC_SGE_HOSTKEY = process.env.AEC_SGE_HOSTKEY;
const AEC_NAT_HOSTKEY = process.env.AEC_NAT_HOSTKEY;

console.log('AEC_ENV:' + AEC_ENV);
console.log('NAT_IP:' + NAT_IP);
console.log('AEC_SGE_IP:' + AEC_SGE_IP);
console.log('AEC_NAT_HOSTKEY:' + AEC_NAT_HOSTKEY);
console.log('AEC_SGE_HOSTKEY:' + AEC_SGE_HOSTKEY);

//Set up electron
app.setName('DeploymentWatcher');
oldUserData = app.getPath('userData');
newUserData = oldUserData.replace('Electron', 'AECJobTool');
app.setPath('userData', newUserData);
let appPaths = {
    userData:app.getPath('userData'),
};

//3rd party Requires
const jStorage = require('electron-json-storage');

//Custom Requires
const ScriptRunner = require('./ScriptRunner');
let cm = require('./ConnectionManager');

let commands = [];

// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

l.debug("User Data Path: " + app.getPath('userData'));

cm.on('connected', () => {
    mainWindow.webContents.send('connected');
});

cm.on('disconnected', () => {
    mainWindow.webContents.send('disconnected');
});

ipcMain.on('connect', () => {
    //let connCommand = 'plink -t -i  ..\\keys\\EKM-Prod_KeyPair.ppk ec2-user@54.70.110.35 "sudo ssh -t -i /root/.ssh/EKM-Prod_KeyPair.pem root@10.220.130.30"';
    let connCommand = null;
    if(AEC_ENV === 'INSIDEVPC'){
        connCommand = 'plink -hostkey ' + AEC_SGE_HOSTKEY + ' -t -i  .\\keys\\EKM-Prod_KeyPair.ppk root@' + AEC_SGE_IP + '"';
    } else {
        connCommand = 'plink -hostkey ' + AEC_NAT_HOSTKEY + ' -t -i  .\\keys\\EKM-Prod_KeyPair.ppk ec2-user@' + NAT_IP + ' "sudo ssh -o StrictHostKeyChecking=no -t -i /root/.ssh/EKM-Prod_KeyPair.pem root@' + AEC_SGE_IP + '"';

    }

    console.log('Command: ', connCommand);
    cm.connect(connCommand);
});

ipcMain.on('disconnect', () => {
    cm.disconnect();
});

ipcMain.on('delete', ($event, $data) => {
    l.debug('Caught Delete Request...', $data);
    l.debug('Force: ' + $data.force);
    l.debug('ID: ', + $data.jobId);

    let cmd = null;

    if($data.force === true){
        cmd = cm.sendCommand('qdel -f ' + $data.jobId);
    } else {
        cmd = cm.sendCommand('qdel ' + $data.jobId);
    }

    if(cmd !== null){
        cmd.once('complete', ($data) => {
            mainWindow.webContents.send('qdelComplete');
        });
    } else {
        mainWindow.webContents.send('commandCancelled');
        l.debug('qdel command is null, not sending...');
    }
});

ipcMain.on('queryStatus', () => {
    //Mock run
    // let cmd = cm.sendCommand('qstat',
    //     'qstat;echo "rkxF94KPx"' + '\r\n' +
    //     '\r\n' +
    //     'job-ID  prior   name       user         state submit/start at     queue                          slots ja-task-ID' + '\r\n' +
    //     '-----------------------------------------------------------------------------------------------------------------' + '\r\n' +
    //     '    120 0.56000 EKM        jake.callery qw    01/27/2017 21:24:11                                    2' + '\r\n' +
    //     '    121 0.56000 EKM        jake.callery qw    01/27/2017 21:24:11                                    2' + '\r\n' +
    //     '    122 0.56000 EKM        jake.callery qw    01/27/2017 21:24:11                                    2' + '\r\n' +
    //     '    123 0.56000 EKM        jake.callery qw    01/27/2017 21:24:11                                    2' + '\r\n' +
    //     ''
    // );

    let cmd = cm.sendCommand('qstat');
    if(cmd !== null){
        cmd.once('complete', ($data) => {
            mainWindow.webContents.send('clearJobsTable');
            console.log('**************************');
            let foundAJob = false;
            for(let i = 0; i < cmd.returnedLines.length; i++) {
                let str = cmd.returnedLines[i];
                str = str = str.replace(/ +(?= )/g,'');
                let words = str.split(' ');
                console.log(str);
                if(words.length > 2 && words[0] === 'job-ID'){
                    l.debug('Active jobs');
                    for(let k = i+2; k < cmd.returnedLines.length; k++){
                        let jobString = cmd.returnedLines[k].replace(/ +(?= )/g,'');
                        let jobWords = jobString.split(' ');
                        console.log('Job Words Length: ' + jobWords.length);
                        console.log('Job Words: ', jobWords);
                        if(jobWords.length >= 9){
                            mainWindow.webContents.send('populateJobTable',{
                                id: jobWords[1],
                                user: jobWords[4],
                                state: jobWords[5],
                                time: jobWords[6]
                            });
                            foundAJob = true;
                        } else {
                            //done
                            break;
                        }
                    }
                    if(foundAJob){
                        //Done looking
                        break;
                    }
                }
            }

            if(!foundAJob){
                l.info('No active jobs');
            }
            l.info('== Query Status Complete ==');
            mainWindow.webContents.send('qstatComplete');
            console.log('**************************');
        });
    }
});

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
            icon: __dirname + '/../ansysicon.png'
        });
    cm.mainWindow = mainWindow;

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
        cm.disconnect();
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

