/**
 * Created with JetBrains PhpStorm.
 * User: Jake
 */

define(['jac/logger/BaseTarget', 'jac/utils/ObjUtils', 'jac/logger/events/LogEvent'],
    function(BaseTarget, ObjUtils, LogEvent){
        return (function(){
            /**
             * Creates a UILogTarget object
             * @extends {BaseTarget}
             * @constructor
             */
            function UILogTarget($uiManager){

                //super
                BaseTarget.call(this);

                //Public
                this.uiManager = $uiManager;

                console.log('New UI Log Target');

            }

            //Inherit / Extend
            ObjUtils.inheritPrototype(UILogTarget, BaseTarget);

            /**
             * Prints args to the browser console.  Dispatchers LogEvent.TARGET_UPDATED when done
             * @param {...} $args variadic args
             * @override
             */
            UILogTarget.prototype.output = function($args){
                //console.log('Here');
                if(this.isEnabled){
                    var self = this;
                    UILogTarget.superClass.output.call(self, arguments);
                    //var list = Array.prototype.slice.call(arguments);
                    var str = Array.from(arguments).join('');
                    self.uiManager.logToGUI.call(self.uiManager, str);
                    this.dispatchEvent(new LogEvent(LogEvent.TARGET_UPDATED));

                }
            };

            //Return constructor
            return UILogTarget;
        })();
    });

