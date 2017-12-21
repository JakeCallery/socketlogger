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
            this.emit('newlogdata', $data.toString());
        });

        this.socket.on('end', ($e) => {
            l.debug(this.name + ' caught end');
            this.emit('end', $e);
        });

        this.socket.on('error', ($e) => {
            l.debug(this.name + ' error: ' + $e);
            this.emit('remoteerrordisconnect', $e);
        })
    }
}

module.exports = Client;