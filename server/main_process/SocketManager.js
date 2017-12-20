const l = require('./Logger').logger;
const EventEmitter = require('events').EventEmitter;
const singleton = Symbol();
const singletonEnforcer = Symbol();

//Constructor
class SocketManager extends EventEmitter {
    constructor(enforcer){
        super();
        if(enforcer != singletonEnforcer) {
            //super();
            console.log('Should not be here');
            throw "Cannot construct singleton";
        }

        l.debug('Socket Manager');
    }

    static get instance() {
        if(!this[singleton]) {
            this[singleton] = new SocketManager(singletonEnforcer);

            this[singleton].isConnected = false;
            this[singleton].connectCheckTimer = null;
            this[singleton].commandList = [];
            this[singleton].mainWindow = null;

        }
        return this[singleton];
    }
}

//Set up static property
module.exports = SocketManager.instance;