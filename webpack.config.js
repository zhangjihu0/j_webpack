let path = require('path');
class P {
    apply(compiler) {
        console.log('satrt');
        compiler.hooks.emit.tap('emit', function () {
            console.log('emit');
        })
    }
}

class P1 {
    apply(compiler) {
        compiler.hooks.afterPlugin.tap('emit', function () {
            console.log('afterPlugin');
        })
    }
}


module.exports = {
    mode: 'development',
    entry: './src/index.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [
            {
                test: /\.less$/,
                use: [
                    path.resolve(__dirname, 'laoder', 'style-loader'),
                    path.resolve(__dirname, 'loader', 'less-loader')
                ]
            },

        ]
    },
    plugins: [
        new 
    ]
}