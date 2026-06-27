import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { createRequire } from 'module';

// 配置文件路径（运行时基于 cwd 解析：dev=项目根，prod=standalone 目录）
const CONFIG_PATH = path.join(process.cwd(), 'config', 'app.config.js');
// 提供给配置文件内部使用的 require（支持配置里 require 其它模块）
const _require = createRequire(import.meta.url);

let _cache = null; // { mtime, config }

function readConfig() {
    const code = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const moduleObj = { exports: {} };
    const ctx = {
        module: moduleObj,
        exports: moduleObj.exports,
        require: _require,
        process,
        console,
        __dirname: path.dirname(CONFIG_PATH),
        __filename: CONFIG_PATH,
    };
    // 用 vm 独立执行配置文件，避免被构建器静态分析 require 路径
    vm.runInNewContext(code, ctx, { filename: CONFIG_PATH });
    return moduleObj.exports;
}

/**
 * 读取全局 APP 配置。基于文件 mtime 缓存：修改配置文件后即时生效。
 * @returns {{port:number,host:string,secret:string,users:Array,apiProxy:Object}}
 */
export function loadConfig() {
    try {
        const stat = fs.statSync(CONFIG_PATH);
        if (_cache && _cache.mtime === stat.mtimeMs) return _cache.config;
        const config = readConfig();
        _cache = { mtime: stat.mtimeMs, config };
        return config;
    } catch (err) {
        if (_cache) return _cache.config;
        throw new Error(`加载 APP 配置失败: ${err.message}`);
    }
}
