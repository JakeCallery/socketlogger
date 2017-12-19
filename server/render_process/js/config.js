var USE_COMPILED = false;
var require = ({
    waitSeconds: 0,
    baseUrl: './js',
    paths: {
        json2:'libs/json2'
    },
    shim: {
        json2: {
            exports: 'JSON'
        }
    }
});

if(typeof module !== 'undefined' && module.exports){
    module.exports = {requireConfig: require};
}
