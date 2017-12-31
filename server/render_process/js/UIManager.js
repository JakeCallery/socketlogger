/**
 * Created with IntelliJ IDEA.
 * User: Jake
 */

import L from 'jac/logger/Logger';
import EventUtils from 'jac/utils/EventUtils';
import EventDispatcher from 'jac/events/EventDispatcher';
import GEB from 'jac/events/GlobalEventBus';
import JacEvent from 'jac/events/JacEvent';
import FD from 'FeatureDetector';

export default class UIManager extends EventDispatcher {
    constructor($doc) {
        super();
        this.doc = $doc;

    }

    init() {
        let self = this;
        this.geb = new GEB();
        this.prefs = {};

        //Delegates
        this.saveLogButtonClickDelegate = EventUtils.bind(self, self.handleSaveLogClick);
        this.clearLogButtonClickDelegate = EventUtils.bind(self, self.handleClearLogClick);

        //DOM
        this.body = this.doc.body;
        this.mainDiv = this.doc.getElementById('mainDiv');
        this.logDiv = this.doc.getElementById('logDiv');
        this.saveLogButton = this.doc.getElementById('saveLogButton');
        this.clearLogButton = this.doc.getElementById('clearLogButton');

        L.debug('Save Log Button: ', this.saveLogButton);

        //Events
        EventUtils.addDomListener(self.saveLogButton, 'click', self.saveLogButtonClickDelegate);
        EventUtils.addDomListener(self.clearLogButton, 'click', self.clearLogButtonClickDelegate);

        //Set up electron requires
        if (FD.isRunningInElectron()) {
            this.fs = nodeRequire('fs');
            this.remote = nodeRequire('electron').remote;
            this.dialog = this.remote.dialog;
            this.ipcRenderer = nodeRequire('electron').ipcRenderer;
            this.clipboard = nodeRequire('electron').clipboard;
            this.dialog = this.remote.dialog;

            L.debug('IsDebugMode: ', this.remote.getGlobal('isDebugMode'));

            if(this.remote.getGlobal('isDebugMode').toString() === 'true'){
                this.remote.getCurrentWindow().openDevTools();
            }

            this.ipcRenderer.on('newlogdata', ($e, $data) => {
                L.debug('New Log Data: ', $data);
                this.generateLogLine($data);
            });

            this.ipcRenderer.on('logToGUI', ($e, $msg) => {
                // let p = this.doc.createElement('p');
                // p.style.color = "#555555";
                // let textNode = this.doc.createTextNode($msg);
                // p.appendChild(textNode);
                // this.mainDiv.appendChild(p);
                L.log($msg);
            });

            //get prefs
            this.disableButtons();
            this.ipcRenderer.send('requestPrefs', function ($e) {
                L.log('Loading User Preferences...');
            });

            this.ipcRenderer.on('gotPrefs', function ($e, $msg) {
                self.prefs = $msg;
                if (self.prefs) {
                    //TODO: Set preferences here
                    // if(typeof(self.prefs['dataDir']) !== 'undefined'){
                    //     L.debug('Setting Data from Prefs');
                    //     //self.dataDirInput.value = self.prefs['dataDir'];
                    //
                    // } else {
                    //     L.debug('No previous data dir saved');
                    // }

                } else {
                    L.log('No previous preferences saved.');
                }
                self.enableButtons();
            });
        }
    }

    generateLogLine($data, $isInternal) {
        let p = this.doc.createElement('p');
        let textNode = this.doc.createTextNode($data);
        p.appendChild(textNode);
        this.logDiv.appendChild(p);

        let tokens = $data.split(' ');

        if ($isInternal) {
            p.style.color = '#888888';
        } else if (tokens[0] === '[DEBUG]') {
            p.style.color = '#f07e1f';
        } else if (tokens[0] === '[ERROR]') {
            p.style.color = '#cc0000';
        } else if (tokens[0] === '[WARNING]') {
            p.style.color = '#fffa94';
        } else if (tokens[0] === '[INFO]') {
            p.style.color = '#ffffff';
        } else {
            p.style.color = '#ffffff';
        }
    }

    sendMessageToIPCR($message, $payload) {
        if (FD.isRunningInElectron()) {
            this.ipcRenderer.send($message, $payload);
        } else {
            L.warn('Not running under electron, message not sent: ' + $message);
        }
    }

    handleClearLogClick($e) {
        L.debug('Caught Clear Log Click');
        let logPs = this.logDiv.getElementsByTagName('p');
        let numLogPs = logPs.length;
        for(let el in numLogPs){
            el.parentNode.removeChild(el);
        }
        for(let i = numLogPs -1; i >= 0; i--){
            logPs[i].parentNode.removeChild(logPs[i]);
        }
    }

    handleSaveLogClick($e) {
        L.debug('Save Log Clicked');
        let logPs = this.logDiv.getElementsByTagName('p');
        L.debug('Log entries to save: ' + logPs.length);

        if(logPs.length > 0){
            this.disableButtons();
            this.dialog.showSaveDialog(
                {
                    title: 'Save Log File',
                    filters: [
                        {name: 'Log File', extensions: ['log']}
                    ]
                },
                ($filename) => {
                    if($filename){
                        L.debug('FileName: ' + $filename);
                        let wstream = this.fs.createWriteStream($filename);

                        wstream.on('error', ($e) => {
                            L.error('Log Write Error: ', $e);
                            this.generateLogLine('ERROR: Log Write Error: ', $e.toString(), true);
                            this.enableButtons();
                        });

                        wstream.on('finish', () => {
                            L.debug('Log File Written To: ' + $filename);
                            this.generateLogLine('Log File Written To: ' + $filename, true);
                            this.enableButtons();
                        });

                        for(let i = 0; i < logPs.length; i++){
                            wstream.write(logPs[i].innerHTML.toString() + '\n');
                        }
                        wstream.end();
                    } else {
                        this.generateLogLine('Log File Save Canceled', true);
                        this.enableButtons();
                    }

                }
            );
        } else {
            L.error('No Log Lines To Save');
            this.generateLogLine('ERROR: No log to save', true);
            this.enableButtons();
        }

    }

/*
    handleDebugClick($e) {
        if (FD.isRunningInElectron()) {
            this.remote.getCurrentWindow().toggleDevTools();
        }
    }
*/

    savePrefs() {
        L.debug("Save Prefs");
    }

    disableButtons() {
        this.saveLogButton.disabled = true;
        this.clearLogButton.disabled = true;
    }

    enableButtons() {
        this.saveLogButton.disabled = false;
        this.clearLogButton.disabled = false;
        //this.resetUI();
    }

/*
    handleDebugClick($e) {
        if (FD.isRunningInElectron()) {
            this.remote.getCurrentWindow().toggleDevTools();
        }
    }
*/

    logToGUI($msg) {
        // this.logTextArea.value += ($msg + '\n');
        // if(this.scrollLogCheckBox.checked){
        //      this.logTextArea.scrollTop = this.logTextArea.scrollHeight;
        // }
    }
}
