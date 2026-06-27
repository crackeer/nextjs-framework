/**
 * 全局 APP 配置
 * ------------------------------------------------------------------
 * 该文件在运行时被读取（lib/config.js），修改后需重启服务生效。
 *
 * 字段说明：
 *   port     服务监听端口
 *   host     服务监听地址（0.0.0.0 = 所有网卡）
 *   secret   登录令牌签名密钥，请改成随机字符串
 *   users    用户列表，账密以明文存放（仅适用于内部工具，勿放敏感数据）
 *   apiProxy API 代理目标配置
 *             key   = EndHost Name（用于 /proxy/{EndHost Name}/path*）
 *             value = 目标站点 baseURL
 *   ssh      SSH 服务器列表，用于 Web 终端连接
 *             name      显示名称（唯一，用于下拉选择）
 *             host      SSH 主机地址
 *             port      SSH 端口（默认 22）
 *             username  登录用户名
 *             password  密码（与 privateKey 二选一）
 *             privateKey 私钥内容（PEM 格式字符串）
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

    // SSH 服务器列表：在顶部导航 Ssh 下拉中选择连接
    ssh: [
        // {
        //     name: 'web-server',
        //     host: '192.168.1.100',
        //     port: 22,
        //     username: 'root',
        //     password: 'your-password',
        // },
        // {
        //     name: 'db-server',
        //     host: '192.168.1.200',
        //     port: 22,
        //     username: 'ubuntu',
        //     privateKey: '-----BEGIN OPENSSH PRIVATE KEY-----\n...\n-----END OPENSSH PRIVATE KEY-----',
        // },
    ],

    // FTP 服务器列表：在顶部导航 Ftp 下拉中选择连接
    // secure: true 走 FTPS（显式 TLS），false 走普通 FTP
    ftp: [
        // {
        //     name: 'ftp-server',
        //     host: '192.168.1.50',
        //     port: 21,
        //     user: 'anonymous',
        //     password: 'anon@',
        //     secure: false,
        // },
    ],

    // 阿里云 OSS 配置列表：在顶部导航 Oss 下拉中选择连接
    // region 形如 'oss-cn-hangzhou'；bucket 为存储空间名
    oss: [
        // {
        //     name: 'my-oss',
        //     region: 'oss-cn-hangzhou',
        //     bucket: 'my-bucket',
        //     accessKeyId: 'your-access-key-id',
        //     accessKeySecret: 'your-access-key-secret',
        // },
    ],
};
