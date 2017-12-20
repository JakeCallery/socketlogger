const l = require('./Logger').logger;
const EventEmitter = require('events').EventEmitter;
const singleton = Symbol();
const singletonEnforcer = Symbol();
const net = require('net');
const Client = require('./Client');

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

    initServer() {
        let self = this;
        self.server = net.createServer();

        self.server.on('listening', ($e) => {
            let address = self.server.address();
            l.debug('Server Listening: ' + address.address + ':' + address.port);
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
        });

        self.server.listen(8999, '0.0.0.0');


    }
}

//Set up static property
module.exports = SocketManager.instance;