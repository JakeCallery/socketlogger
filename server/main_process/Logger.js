/**
 * Created by Jake on 10/28/2016.
 */

//Singleton
//If this doesn't feel right, check out here:
//https://simplapi.wordpress.com/2012/05/14/node-js-singleton-structure/

//Setup logging
const winston = require('winston');
const UILogger = require('./UILogger');
const uiLoggerInstance = new winston.transports.UILogger({
    level: 'debug',
    timestamp: function () {
        let currentDate = new Date();
        return currentDate.getDate() + "."
            + (currentDate.getMonth() + 1) + "."
            + currentDate.getFullYear() + "::"
            + currentDate.getHours() + ":"
            + currentDate.getMinutes() + ":"
            + currentDate.getSeconds();
    },
    formatter: function (options) {
        // Return string will be passed to logger.
        return '[(' + options.level.toUpperCase() + ')' + options.timestamp() + '] ' + (undefined !== options.message ? options.message : '') +
            (options.meta && Object.keys(options.meta).length ? '\n\t' + JSON.stringify(options.meta) : '' );
    }
});

let logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            timestamp: function () {
                let currentDate = new Date();
                return currentDate.getDate() + "."
                    + (currentDate.getMonth() + 1) + "."
                    + currentDate.getFullYear() + "::"
                    + currentDate.getHours() + ":"
                    + currentDate.getMinutes() + ":"
                    + currentDate.getSeconds();
            },
            formatter: function (options) {
                // Return string will be passed to logger.
                return '[(' + options.level.toUpperCase() + ')' + options.timestamp() + '] ' + (undefined !== options.message ? options.message : '') +
                    (options.meta && Object.keys(options.meta).length ? '\n\t' + JSON.stringify(options.meta) : '' );
            }
        }),
       uiLoggerInstance
    ]
});

logger.uiLoggerInstance = uiLoggerInstance;

let self = module.exports = {
    logger: logger
};


