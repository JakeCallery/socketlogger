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

        //DOM
        this.body = this.doc.body;
        this.mainDiv = this.doc.getElementById('mainDiv');
        this.logDiv = this.doc.getElementById('logDiv');
        this.saveLogButton = this.doc.getElementById('saveLogButton');
        this.fs = nodeRequire('fs');

        L.debug('Save Log Button: ', this.saveLogButton);

        //Events
        EventUtils.addDomListener(self.saveLogButton, 'click', self.saveLogButtonClickDelegate);

        //Set up electron requires
        if (FD.isRunningInElectron()) {
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

                let p = this.doc.createElement('p');
                let textNode = this.doc.createTextNode($data);
                p.appendChild(textNode);
                this.logDiv.appendChild(p);

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

    sendMessageToIPCR($message, $payload) {
        if (FD.isRunningInElectron()) {
            this.ipcRenderer.send($message, $payload);
        } else {
            L.warn('Not running under electron, message not sent: ' + $message);
        }
    }

    handleCopyLogClick($e) {
        //this.clipboard.writeText(this.logTextArea.value);
        //this.logToGUI('Log copied to clipboard');
    }

    handleClearLogClick($e) {
        // this.logTextArea.value = '';
    }

    handleSaveLogClick($e) {
        L.debug('Save Log Clicked');
        this.dialog.showSaveDialog(
            {
                title: 'Save Log File',
                filters: [
                    {name: 'Log File', extensions: ['log']}
                ]
            },
            ($filename) => {
                L.debug('FileName: ' + $filename);
                let wstream = this.fs.createWriteStream($filename);

                wstream.on('error', ($e) => {
                    L.error('Log Write Error: ', $e);
                });

                wstream.on('finish', () => {
                    L.debug('Log File Written To: ' + $filename);
                });

                //get child p's from LogDiv
                let logPs = this.logDiv.getElementsByTagName('p');
                L.debug(logPs);
                L.debug('Num Ps: ' + logPs.length);
                L.debug('Content: ', logPs[0].innerHTML.toString());

                for(let i = 0; i < logPs.length; i++){
                    wstream.write(logPs[i].innerHTML.toString() + '\n');
                }

                wstream.end();
            }
        );
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
        //this.copyLogButton.disabled = true;
        //this.clearLogButton.disabled = true;
    }

    enableButtons() {
        //this.copyLogButton.disabled = false;
        //this.clearLogButton.disabled = false;
        //this.resetUI();
    }

    handleDebugClick($e) {
        if (FD.isRunningInElectron()) {
            this.remote.getCurrentWindow().toggleDevTools();
        }
    }

    logToGUI($msg) {
        // this.logTextArea.value += ($msg + '\n');
        // if(this.scrollLogCheckBox.checked){
        //      this.logTextArea.scrollTop = this.logTextArea.scrollHeight;
        // }
    }
}
