/**
 * Created with JetBrains PhpStorm.
 * User: Jake
 */

import BaseTarget from 'jac/logger/BaseTarget';
import LogEvent from 'jac/logger/events/LogEvent';

export default class UILogTarget extends BaseTarget{
    constructor($uiManager){
        super();
        this.uiManager = $uiManager;
        console.log('New UI Log Target');
    }

    output($args){
        //console.log('Here');
        if(this.isEnabled){
            let self = this;
            super.output.call(self, arguments);
            //var list = Array.prototype.slice.call(arguments);
            let str = Array.from(arguments).join('');
            self.uiManager.logToGUI(str);
            this.dispatchEvent(new LogEvent(LogEvent.TARGET_UPDATED));
        }
    }
}

