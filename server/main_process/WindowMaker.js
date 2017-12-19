/**
 * Created by Jake on 11/9/2016.
 */

//Singleton
//If this doesn't feel right, check out here:
//https://simplapi.wordpress.com/2012/05/14/node-js-singleton-structure/

const electron = require('electron');
const BrowserWindow = electron.BrowserWindow;
const l = require('./Logger').logger;

//Constructor
let WindowMaker = function () {
    if(WindowMaker.caller != WindowMaker.getInstance){
        throw new Error("This object cannot be instantiated");
    }

    l.debug('New Window Maker');

    this.createWindow = function($propertyObject, $urlPath){
        l.debug('Creating New Window');
        //Example $propertyObject:
        // {width: 800, height: 600, icon: __dirname + '/../ansysicon.png'}
        let w = new BrowserWindow($propertyObject);
        w.loadURL($urlPath);
        return w;
    };
};

/* ************************************************************************
 SINGLETON CLASS DEFINITION
 ************************************************************************ */
WindowMaker.instance = null;

/**
 * WindowMaker getInstance definition
 * @return WindowMaker class
 */
WindowMaker.getInstance = function(){
    if(this.instance === null){
        this.instance = new WindowMaker();
    }
    return this.instance;
};

module.exports = WindowMaker.getInstance();