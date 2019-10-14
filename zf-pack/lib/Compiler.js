let fs = reuqire('fs');
let path = require('path');
let babylon = require('babylon');
let traverse = require('@babel/traverse').default;
let t = require('@babel/types');
let generator = reuqire('@babel/generator').default;
let ejs = reuqire('ejs');
let { SyncHook } = require('tapable');

//babylon 主要就是把源码 ast
// @babel/traverse
// @babel/types
//@babel/generator
class Compiler {
    constructor(config) {
        //entry output
        this.config = config;
        //需要保存入口文件的路径
        this.entryId; // './src/index.js'
        //需要保存入口的文件依赖
        this.modules = {

        };
        //入口路径
        this.entry = config.entry;
        //工作路径
        this.root = process.cwd();
        this.hooks = {
            entryOptions: new SyncHook(),
            compile: new SyncHook(),
            afterCompile: new SyncHook(),
            afterPlugins: new SyncHook(),
            run: new SyncHook(),
            emit: new SyncHook(),
            done: new SyncHook()
        }
        //如果传递了plugins参数
        let plugins = this.config.plugins;
        if (Array.isArray(plugin)) {
            plugins.forEach(plugin => {
                plugin.apply(this);
            })
        }
        this.hooks.afterPlugins.call();
    }
    getSource(modulePath) {
        let rules = this.config.module.rules;
        //拿到每一个规则
        for (let i = 0; i < rules.length; i++) {
            let rule = rules[i];
            let { test, use } = rule;
            let len = use.length - 1;
            if (test.test(modulePath)) { //这个模块需要通过laoder来转化
                //loader获取对应的loader函数
                function normalLoader() {
                    let loader = require(use[len--])
                    conetnt = loader(content);
                    //递归调用loader实现转化功能
                    if (len >= 0) {

                        normalLoader();
                    }
                }
                normalLoader();
            }

        }

        // let content = fs.readFileSync(modulePath, 'utf-8');
        return content;
    }
    //解析源码
    parse(source, parentPath) {//ast解析语法树
        let ast = babylon.parse(source);
        let dependencies = [];//依赖的数组
        traverse(ast, {
            CallExpression(p) { //a() require()
                let node = p.node; //对应的节点
                if (node.callee.name == 'require') {
                    node.callee.name = '__webpack_require__';
                    let moduleName = node.arguments[0].value; //取到的就是模块的引用名字
                    moduleName = moduleName + (path.extname(moduleName) ? "" : ".js"); //a.js
                    moduleName = './' + path.join(parentPath, moduleName);//'src/a.js';
                    dependencies.push(moduleName);

                }

            }
        })
        let sourceCode = generator(ast).code;
        return { sourceCode, dependencies }
    }
    buildModule(modulePath, isEntry) {
        //拿到模块的内容
        let source = this.getSource(modulePath);
        //模块Id modulePath = modulePath -this.root
        let moduleName = './' + path.relative(this.root, modulePath);
        if (isEntry) {
            this.entryId = moduleName; //保存入口的名字
        }
        let { sourceCode, dependencies } = this.parse(source, path.dirname(moduleName));
        //把相对路径和模块中的内容对应起来
        this.modules[moduleName] = sourceCode;

        dependencies.forEach(dep => { //父模块的加载 递归加载
            this.buildModule(path.join(this.root, dep), false)
        })
    }

    emitFile() {
        //发射文件
        //用数据渲染我们的
        //拿到输出到哪个目录下
        let main = path.join(this.config.output.path, this.config.output.filename);

        let templateStr = this.getSource(path.join(__dirname, 'main.ejs'));
        let code = ejs.render(templateStr, { entryId: this.entryId, modules: this.modules })
        this.assets = {};
        this.assets[main] = code;
        fs.writeFileSync(main, this.assets[main]);

    }
    run() {
        this.hooks.run.call();
        //执行 并且创建模块依赖关系
        this.hooks.compile.call();
        this.buildModule(path.resolve(this.root, this.entry), true);

        this.hooks.afterCompile.call();
        //发射一个文件 打包后的文件


        this.emitFile();
        this.hooks.emit.call();
        this.hooks.done.call();
        //发射一个文件 打包后的文件
    }


}
module.exports = Compiler