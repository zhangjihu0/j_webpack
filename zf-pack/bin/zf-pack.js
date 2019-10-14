#! /usr/bin/env node
console.log('start')
//需要执行到的当前执行名的路径 拿到webpack.config.js 
let path = require('path');
let config = require(path.resolve(__dirname));

let Compiler = require('../lib/Compiler.js');
let compiler = new Compiler(config);
compiler.hooks.entryOptions.call();
//标识运行编译
compiler.run();

