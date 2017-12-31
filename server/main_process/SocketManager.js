const l = require('./Logger').logger;
const EventEmitter = require('events').EventEmitter;
const singleton = Symbol();
const singletonEnforcer = Symbol();
const net = require('net');
const Client = require('./Client');
const electron = require('electron');

//Constructor
class SocketManager extends EventEmitter {
    constructor(enforcer){
        super();
        if(enforcer != singletonEnforcer) {
            //super();
            console.log('Should not be here');
            throw "Cannot construct singleton";
        }

        this.server = null;
        this.clients = [];
        l.debug('Socket Manager');
    }

    static get instance() {
        if(!this[singleton]) {
            this[singleton] = new SocketManager(singletonEnforcer);
        }
        return this[singleton];
    }

    initServer($mainWindow) {
        let self = this;
        this.mainWindow = $mainWindow;
        self.server = net.createServer();

        self.server.on('listening', ($e) => {
            let address = self.server.address();
            let status = 'Server Listening: ' + address.address + ':' + address.port;
            global.serverStatus = status;
            l.debug(status);
            this.mainWindow.webContents.send('logToGUI', status);
            this.mainWindow.webContents.send('serverStatus', status);
        });

        self.server.on('error', ($e) => {
            l.debug('Server Error: ', $e);
        });

        self.server.on('connection', ($socket) => {
            let client = new Client($socket);

            l.debug('Adding Client: ' + client.name);
            self.clients.push(client);
            l.debug('Client List Length: ' + self.clients.length);

            //Client Events
            client.on('end', ($e) => {
                l.debug('Removing Client: ' + client.name);
                self.clients.splice(self.clients.indexOf(client), 1);
                l.debug('Client List Length: ' + self.clients.length);
            });

            client.on('remoteerrordisconnect', ($e) => {
                l.debug('Caught Remote Disconnect, removing client: ' + client.name);
                self.clients.splice(self.clients.indexOf(client), 1);
                l.debug('Client List Length: ' + self.clients.length);
            });

            client.on('newlogdata', ($e) => {
                self.emit('newlogdata', $e);
            });
        });

        //Get port from args
        let args = process.argv;
        let lastArg = args[args.length - 1];
        l.debug('Args: ', args);
        l.debug('Last Arg: ', lastArg);
        if(Number.isInteger(parseInt(lastArg))){
            l.debug('Port from command line: ', parseInt(lastArg));
            self.server.listen(parseInt(lastArg), '0.0.0.0');
        } else {
            l.debug('Using default port: 8999');
            self.server.listen(8999, '0.0.0.0');
        }

    }
}

//Set up static property
module.exports = SocketManager.instance;