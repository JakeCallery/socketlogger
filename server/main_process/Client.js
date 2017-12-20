const l = require('./Logger').logger;
const EventEmitter = require('events').EventEmitter;
const net = require('net');

//Constructor
class Client extends EventEmitter {
    constructor($socket){
        super();
        this.socket = $socket;
        this.name = $socket.remoteAddress + ':' + $socket.remotePort;

        this.socket.on('data', ($data) => {
            l.debug('Client Data: ' + $data);
        });

        this.socket.on('end', ($e) => {
            l.debug(this.socket.name + ' caught end');
            this.emit('end', $e);
        });
    }
}

module.exports = Client;