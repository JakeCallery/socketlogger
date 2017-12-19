/**
 * Created by Jake on 1/25/2017.
 */
var util = require('util'),
    winston = require('winston');

var UILogger = winston.transports.UILogger = function (options) {
    //
    // Name this logger
    //
    this.name = 'uiLogger';

    this.options = options;

    //
    // Set the level from your options
    //
    this.level = options.level || 'info';

    //Needs to be set externally after a window is available
    this.renderWindow = null;
};

//
// Inherit from `winston.Transport` so you can take advantage
// of the base functionality and `.handleExceptions()`.
//
util.inherits(UILogger, winston.Transport);

//TODO: Split this out into a real utility, or use jaclib clone
UILogger.prototype.clone = function (obj) {
    //
    // We only need to clone reference types (Object)
    //
    var copy = {};

    if (obj instanceof Error) {
        // With potential custom Error objects, this might not be exactly correct,
        // but probably close-enough for purposes of this lib.
        copy = { message: obj.message };
        Object.getOwnPropertyNames(obj).forEach(function (key) {
            copy[key] = obj[key];
        });

        return copy;
    }
    else if (!(obj instanceof Object)) {
        return obj;
    }
    else if (obj instanceof Date) {
        return new Date(obj.getTime());
    }

    for (var i in obj) {
        if (Array.isArray(obj[i])) {
            copy[i] = obj[i].slice(0);
        }
        else if (obj[i] instanceof Buffer) {
            copy[i] = obj[i].slice(0);
        }
        else if (typeof obj[i] != 'function') {
            copy[i] = obj[i] instanceof Object ? this.clone(obj[i]) : obj[i];
        }
        else if (typeof obj[i] === 'function') {
            copy[i] = obj[i];
        }
    }

    return copy;
};

UILogger.prototype.log = function (level, msg, meta, callback) {
    //
    // Store this message and metadata, maybe use some custom logic
    // then callback indicating success.
    //

    if(this.renderWindow){
        this.options.meta = meta;
        this.options.message = msg;
        var output = String(this.options.formatter(this.clone(this.options)));
        this.renderWindow.webContents.send('logToGUI', output);
    } else {
        console.log('Render window is not yet set for logger');
    }
    callback(null, true);
};