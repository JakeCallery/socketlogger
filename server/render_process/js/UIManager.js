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
    function (DOC,EventDispatcher,ObjUtils,L,EventUtils,JacEvent,GEB,FD) {
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
                this.connectButtonClickDelegate = EventUtils.bind(self, self.handleConnectClick);
                this.queryStatusButtonClickDelegate = EventUtils.bind(self, self.handleQueryStatusClick);
                this.debugButtonClickDelegate = EventUtils.bind(self, self.handleDebugClick);
                this.copyLogButtonClickDelegate = EventUtils.bind(self, self.handleCopyLogClick);
                this.clearLogButtonClickDelegate = EventUtils.bind(self, self.handleClearLogClick);
                this.deleteJobButtonClickDelegate = EventUtils.bind(self, self.handleDeleteJobButtonClick);

                //DOM
                this.connectButton = DOC.getElementById('connectButton');
                this.queryStatusButton = DOC.getElementById('queryStatusButton');
                this.debugButton = DOC.getElementById('debugButton');
                this.logTextArea = DOC.getElementById('logTextArea');
                this.copyLogButton = DOC.getElementById('copyLogButton');
                this.clearLogButton = DOC.getElementById('clearLogButton');
                this.clearLogCheckBox = DOC.getElementById('clearLogCheckBox');
                this.scrollLogCheckBox = DOC.getElementById('scrollLogCheckBox');
                this.jobTable = DOC.getElementById('jobTable');
                this.jobIdField = DOC.getElementById('jobIdField');
                this.deleteJobButton = DOC.getElementById('deleteJobButton');
                this.forceDeleteCheckBox = DOC.getElementById('forceDeleteCheckBox');
                //this.body = DOC.body;

                this.connectButton.disabled = false;
                this.queryStatusButton.disabled = true;
                this.deleteJobButton.disabled = true;

                //Events
                EventUtils.addDomListener(self.connectButton, 'click', self.connectButtonClickDelegate);
                EventUtils.addDomListener(self.queryStatusButton, 'click', self.queryStatusButtonClickDelegate);
                EventUtils.addDomListener(self.debugButton, 'click', self.debugButtonClickDelegate);
                EventUtils.addDomListener(self.copyLogButton, 'click', self.copyLogButtonClickDelegate);
                EventUtils.addDomListener(self.clearLogButton, 'click', self.clearLogButtonClickDelegate);
                EventUtils.addDomListener(self.deleteJobButton, 'click', self.deleteJobButtonClickDelegate);
                L.debug('New UI Manager');

                // self.body.addEventListener('focusin', function($evt) {
                //     L.debug('Focus: ', $evt.target.id, $evt.target);
                // });

                //Set up electron requires
                if(FD.isRunningInElectron()){
                    this.remote = nodeRequire('electron').remote;
                    this.dialog = this.remote.dialog;
                    this.fs = nodeRequire('fs');
                    this.ipcRenderer = nodeRequire('electron').ipcRenderer;
                    this.clipboard = nodeRequire('electron').clipboard;

                    this.ipcRenderer.on('scriptStarted', function ($e) {
                        self.disableButtons();
                    });

                    this.ipcRenderer.on('clearJobsTable', function($e, $data){
                        self.clearJobsTable();
                    });

                    this.ipcRenderer.on('scriptComplete', function($e, $exitCode){
                        self.enableButtons();
                    });

                    this.ipcRenderer.on('logToGUI', function($e, $msg){
                        self.logToGUI($msg);
                    });

                    this.ipcRenderer.on('commandCancelled', function($e, $msg){
                        L.error('Command Cancelled');
                        self.resetUI();
                    });

                    this.ipcRenderer.on('qstatComplete', function($e, $msg) {
                        self.resetUI()
                    });

                    this.ipcRenderer.on('qdelComplete', function($e, $msg) {
                        L.log('qdel complete');
                        self.resetUI();
                        self.sendMessageToIPCR('queryStatus');
                    });

                    //get prefs
                    this.disableButtons();
                    this.ipcRenderer.send('requestPrefs', function ($e) {
                       L.log('Loading User Preferences...');
                    });

                    this.ipcRenderer.on('gotPrefs', function($e, $msg){
                        self.prefs = $msg;
                        if(self.prefs) {
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

                    this.ipcRenderer.on('connected', function($e, $msg) {
                        self.isConnected = true;
                        self.connectButton.innerText = 'Disconnect';
                        self.connectButton.disabled = false;
                        self.queryStatusButton.disabled = false;
                        self.deleteJobButton.disabled = false;
                    });

                    this.ipcRenderer.on('disconnected', function($e, $msg) {
                        self.isConnected = false;
                        self.connectButton.innerText = 'Connect';
                        self.connectButton.disabled = false;
                        self.queryStatusButton.disabled = true;
                        self.deleteJobButton.disabled = true;
                    });

                    this.ipcRenderer.on('populateJobTable', function($e, $msg) {
                        //L.debug('Populate Jobs Table');

                        //Insert new row
                        let tr = DOC.createElement('tr');

                        //Id
                        let td = DOC.createElement('td');
                        td.textContent = $msg.id;
                        tr.appendChild(td);

                        //User
                        td = DOC.createElement('td');
                        td.textContent = $msg.user;
                        tr.appendChild(td);

                        //State
                        td = DOC.createElement('td');
                        td.textContent = $msg.state;
                        tr.appendChild(td);

                        //Time
                        td = DOC.createElement('td');
                        td.textContent = $msg.time;
                        tr.appendChild(td);
                        tr.setAttribute('tabindex', "-1");

                        //Listen for click
                        tr.addEventListener('click', self.handleRowClick);

                        let tbody = self.jobTable.children[0];
                        tbody.appendChild(tr);

                       // L.debug($msg);
                    });

                    self.handleRowClick = function($evt) {
                        self.jobIdField.value = $evt.currentTarget.children[0].innerText;
                    }
                }
            }

            //Inherit / Extend
            ObjUtils.inheritPrototype(UIManager, EventDispatcher);
            let p = UIManager.prototype;

            p.clearJobsTable = function(){
                //Clear old table
                let tbody = self.jobTable.children[0];
                for(let i = tbody.children.length-1; i > 0 ; i--){
                    tbody.children[i].removeEventListener('click', self.handleRowClick);
                    tbody.removeChild(tbody.children[i]);
                }
            };

            p.resetUI = function(){
                if(this.isConnected){
                    self.connectButton.disabled = false;
                    self.queryStatusButton.disabled = false;
                    self.deleteJobButton.disabled = false;
                } else {
                    self.connectButton.disabled = false;
                    self.queryStatusButton.disabled = true;
                    self.deleteJobButton.disabled = true;
                }

            };

            p.handleDeleteJobButtonClick = function($e) {
                this.deleteJobButton.disabled = true;
                let jobId = this.jobIdField.value.trim().replace(/\s/g, '');
                if(jobId == ''){
                    L.error('No Job ID Specified');
                    this.resetUI();
                    return;
                }

                L.log('Attempting to delete Job with ID: ', this.jobIdField.value);
                L.log('Checking job ID with known IDs...');

                let tbody = this.jobTable.children[0];

                let foundId = false;
                for(let i = tbody.children.length-1; i > 0 ; i--){
                    let row = tbody.children[i];
                    let idCell = row.children[0];
                    let idFromCell = idCell.innerText;
                    if(idFromCell == jobId){
                        foundId = true;
                        break;
                    }
                }

                if(foundId){
                    L.log('ID Found...');
                    L.log('Sending Delete Command to server...');
                    if(this.forceDeleteCheckBox.checked === true){
                        L.log('Force delete flag set...');
                        this.sendMessageToIPCR('delete', {force:true, jobId:jobId});
                    } else{
                        L.log('Force delete flag not set...');
                        this.sendMessageToIPCR('delete', {force:false, jobId:jobId});
                    }
                } else {
                    L.log('Job ID Not Found');
                    this.resetUI();
                }
            };

            p.sendMessageToIPCR = function($message, $payload) {
                if(FD.isRunningInElectron()){
                    this.ipcRenderer.send($message, $payload);
                }  else {
                    L.warn('Not running under electron, message not sent: '+ $message);
                }
            };

            p.handleCopyLogClick = function($e){
                this.clipboard.writeText(this.logTextArea.value);
                this.logToGUI('Log copied to clipboard');
            };

            p.handleClearLogClick = function($e) {
                this.logTextArea.value = '';
            };

            p.handleDebugClick = function($e){
                if(FD.isRunningInElectron()){
                    this.remote.getCurrentWindow().toggleDevTools();
                }
            };

            p.handleConnectClick = function($e){
                if(this.connectButton.innerText === 'Connect'){
                    this.connectButton.disabled = true;
                    this.connectButton.innerText = 'Connecting...';
                    this.sendMessageToIPCR('connect');
                } else {
                    this.sendMessageToIPCR('disconnect');
                }
            };

            p.handleQueryStatusClick = function($e){
                L.log('Requesting job status from server...');
                this.queryStatusButton.disabled = true;
                this.sendMessageToIPCR('queryStatus');
            };

            p.savePrefs = function(){
                L.debug("Save Prefs");
            };

            p.disableButtons = function(){
                this.copyLogButton.disabled = true;
                this.clearLogButton.disabled = true;
                this.debugButton.disabled = true;
                this.connectButton.disabled = true;
                this.queryStatusButton.disabled = true;
                this.deleteJobButton.disabled = true;
            };

            p.enableButtons = function () {
                this.copyLogButton.disabled = false;
                this.clearLogButton.disabled = false;
                this.debugButton.disabled = false;
                this.connectButton.disabled = false;
                this.queryStatusButton.disabled = false;
                this.deleteJobButton.disabled = false;
                this.resetUI();
            };

            p.handleDebugClick = function($e){
                if(FD.isRunningInElectron()){
                    this.remote.getCurrentWindow().toggleDevTools();
                }
            };

            p.logToGUI = function($msg) {
                this.logTextArea.value += ($msg + '\n');
                if(this.scrollLogCheckBox.checked){
                     this.logTextArea.scrollTop = this.logTextArea.scrollHeight;
                }

            };
            //Return constructor
            return UIManager;
        })();
    });
