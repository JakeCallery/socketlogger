/**
 * Created with IntelliJ IDEA.
 * User: Jake
 */

define([
        'libs/domReady!',
        'jac/events/EventDispatcher',
        'jac/utils/ObjUtils',
        'jac/logger/Logger',
        'jac/utils/EventUtils',
        'jac/events/JacEvent',
        'jac/events/GlobalEventBus',
        'FeatureDetector'
    ],
    function (DOC, EventDispatcher, ObjUtils, L, EventUtils, JacEvent, GEB, FD) {
        return (function () {
            /**
             * Creates a UIManager object
             * @extends {EventDispatcher}
             * @constructor
             */
            function UIManager() {
                //super
                EventDispatcher.call(this);

                let self = this;
                this.geb = new GEB();
                this.prefs = {};
                this.isConnected = false;

                //Delegates
                //this.copyLogButtonClickDelegate = EventUtils.bind(self, self.handleCopyLogClick);
                //this.clearLogButtonClickDelegate = EventUtils.bind(self, self.handleClearLogClick);
                this.debugButtonClickDelegate = EventUtils.bind(self, self.handleDebugClick);

                //DOM
                //this.copyLogButton = DOC.getElementById('copyLogButton');
                //this.clearLogButton = DOC.getElementById('clearLogButton');
                //this.scrollLogCheckBox = DOC.getElementById('scrollLogCheckBox');
                this.body = DOC.body;
                this.mainDiv = DOC.getElementById('mainDiv');
                this.debugButton = DOC.getElementById('debugButton');

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
                    this.fs = nodeRequire('fs');
                    this.ipcRenderer = nodeRequire('electron').ipcRenderer;
                    this.clipboard = nodeRequire('electron').clipboard;

                    this.remote.getCurrentWindow().toggleDevTools();

                    this.ipcRenderer.on('newlogdata', ($e, $data) => {
                        L.debug('New Log Data: ', $data);

                        let p = DOC.createElement('p');
                        let textNode = DOC.createTextNode($data);
                        p.appendChild(textNode);
                        this.mainDiv.appendChild(p);

                    });

                    this.ipcRenderer.on('logToGUI', ($e, $msg) => {
                        let p = DOC.createElement('p');
                        p.style.color = "#555555";
                        let textNode = DOC.createTextNode($msg);
                        p.appendChild(textNode);
                        this.mainDiv.appendChild(p);
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

            //Inherit / Extend
            ObjUtils.inheritPrototype(UIManager, EventDispatcher);
            let p = UIManager.prototype;

            p.sendMessageToIPCR = function ($message, $payload) {
                if (FD.isRunningInElectron()) {
                    this.ipcRenderer.send($message, $payload);
                } else {
                    L.warn('Not running under electron, message not sent: ' + $message);
                }
            };

            p.handleCopyLogClick = function ($e) {
                //this.clipboard.writeText(this.logTextArea.value);
                //this.logToGUI('Log copied to clipboard');
            };

            p.handleClearLogClick = function ($e) {
                // this.logTextArea.value = '';
            };

            p.handleDebugClick = function ($e) {
                if (FD.isRunningInElectron()) {
                    this.remote.getCurrentWindow().toggleDevTools();
                }
            };

            p.savePrefs = function () {
                L.debug("Save Prefs");
            };

            p.disableButtons = function () {
                //this.copyLogButton.disabled = true;
                //this.clearLogButton.disabled = true;
            };

            p.enableButtons = function () {
                //this.copyLogButton.disabled = false;
                //this.clearLogButton.disabled = false;
                //this.resetUI();
            };

            p.handleDebugClick = function ($e) {
                if (FD.isRunningInElectron()) {
                    this.remote.getCurrentWindow().toggleDevTools();
                }
            };

            p.logToGUI = function ($msg) {
                // this.logTextArea.value += ($msg + '\n');
                // if(this.scrollLogCheckBox.checked){
                //      this.logTextArea.scrollTop = this.logTextArea.scrollHeight;
                // }

            };
            //Return constructor
            return UIManager;
        })();
    });
