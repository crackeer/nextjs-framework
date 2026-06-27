/**
 * 全局 APP 配置
 * ------------------------------------------------------------------
 * 该文件在运行时被读取（lib/config.js），修改后无需重新构建：
 *   - 开发模式：直接生效（每次请求重新读取）
 *   - standalone 生产模式：需重启服务（postbuild 已把本文件复制进 standalone）
 *
 * 字段说明：
 *   port     服务监听端口
 *   host     服务监听地址（0.0.0.0 = 所有网卡）
 *   secret   登录令牌签名密钥，请改成随机字符串
 *   users    用户列表，账密以明文存放（仅适用于内部工具，勿放敏感数据）
 *   apiProxy API 代理目标配置
 *             key   = EndHost Name（用于 /proxy/{EndHost Name}/path*）
 *             value = 目标站点 baseURL
 * ------------------------------------------------------------------
 */
module.exports = {
    port: 9393,
    host: '0.0.0.0',
    secret: 'please-change-this-to-a-random-string',

    // 用户列表
    users: [
        { username: 'admin', password: 'admin123' },
        { username: 'guest', password: 'guest123' },
    ],

    // API 代理：访问 /proxy/github/users/octocat
    //   => 请求 https://api.github.com/users/octocat
    apiProxy: {
        github: 'https://api.github.com',
        jsonplaceholder: 'https://jsonplaceholder.typicode.com',
    },
};
