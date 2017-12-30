'use strict';

const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
    entry: {
        indexEntry:'./render_process/js/render_main.js'
    },

    output: {
        filename: '[name].js',
        path: __dirname + './render_process/render_dist',
        publicPath: '/'
    },

    resolve: {
        modules: [
            'node_modules',
            './js',
            './js/jac'
        ]
    },

    module: {
        rules: [
            {
                test: /\.html$/,
                loader: 'html-loader',
                exclude: /node_modules/
            },
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                use: [
                    {
                        loader: 'style-loader',
                    },
                    {
                        loader: 'css-loader',
                        options: {
                            minimize: false,
                            sourceMap: false
                        }
                    }
                ],
                exclude: /node_modules/
            }
        ]
    },

    plugins: [
/*
        new CleanWebpackPlugin(['dist'], {
            root: __dirname + '/../../',
            verbose: true,
            dry: false,
            exclude: []
        }),
*/
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: 'render_process/index.html',
            hash: false,
            chunks: [
                'indexEntry'
            ]
        }),

        function() {
            this.plugin('watch-run', function(watching, callback) {
                console.log('Begin Compile At ' + new Date());
                callback();
            })
        }
    ],
    devtool: 'source-map'
};