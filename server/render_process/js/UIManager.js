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
        //this.copyLogButtonClickDelegate = EventUtils.bind(self, self.handleCopyLogClick);
        //this.clearLogButtonClickDelegate = EventUtils.bind(self, self.handleClearLogClick);
        this.debugButtonClickDelegate = EventUtils.bind(self, self.handleDebugClick);

        //DOM
        //this.copyLogButton = this.doc.getElementById('copyLogButton');
        //this.clearLogButton = this.doc.getElementById('clearLogButton');
        //this.scrollLogCheckBox = this.doc.getElementById('scrollLogCheckBox');
        this.body = this.doc.body;
        this.mainDiv = this.doc.getElementById('mainDiv');
        this.debugButton = this.doc.getElementById('debugButton');

        //Events
        // EventUtils.addDomListener(self.copyLogButton, 'click', self.copyLogButtonClickDelegate);
        // EventUtils.addDomListener(self.clearLogButton, 'click', self.clearLogButtonClickDelegate);
        EventUtils.addDomListener(self.debugButton, 'click', self.debugButtonClickDelegate);
        L.debug('New UI Manager');

        // self.body.addEventListener('focusin', function($evt) {
        //     L.debug('Focus: ', $evt.target.id, $evt.target);
        // });

        //Set up electron requires
        if (FD.isRunningInElectron()) {
            this.remote = nodeRequire('electron').remote;
            this.dialog = this.remote.dialog;
            this.ipcRenderer = nodeRequire('electron').ipcRenderer;
            this.clipboard = nodeRequire('electron').clipboard;

            L.debug('IsDebugMode: ', this.remote.getGlobal('isDebugMode'));

            if(this.remote.getGlobal('isDebugMode').toString() === 'true'){
                this.remote.getCurrentWindow().toggleDevTools();
            }

            this.ipcRenderer.on('newlogdata', ($e, $data) => {
                L.debug('New Log Data: ', $data);

                let p = this.doc.createElement('p');
                let textNode = this.doc.createTextNode($data);
                p.appendChild(textNode);
                this.mainDiv.appendChild(p);

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

    handleDebugClick($e) {
        if (FD.isRunningInElectron()) {
            this.remote.getCurrentWindow().toggleDevTools();
        }
    }

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
