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
 *   ftp      FTP 服务器列表
 *   oss      对象存储配置列表（S3 兼容协议）
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
        {
            name: 'ssh-server1',
            host: '10.33.207.152',
            port: 9002,
            username: 'root',
            password: '123323234567',
        },
         {
            name: 'ssh-server2',
            host: '10.33.207.152',
            port: 9002,
            username: 'root',
            password: '122223232334567',
        }
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

    // 对象存储配置列表（S3 兼容协议）：在顶部导航 Oss 下拉中选择连接
    // 兼容 AWS S3 / 阿里云 OSS / 腾讯云 COS / MinIO / Cloudflare R2 等
    //   region            区域，如 'us-east-1'；阿里云填 'oss-cn-hangzhou'
    //   buckets           存储空间名列表（数组），页面可切换；也兼容单字符串 bucket
    //   accessKeyId       AccessKey ID
    //   accessKeySecret   AccessKey Secret
    //   endpoint          可选，S3 兼容端点（阿里云/MinIO/腾讯云需填写）
    //   forcePathStyle    可选，true 走 path-style（MinIO/部分私有云需要）
    oss: [
        // AWS S3
        // {
        //     name: 'aws-s3',
        //     region: 'us-east-1',
        //     buckets: ['bucket-a', 'bucket-b'],
        //     accessKeyId: 'AKIA...',
        //     accessKeySecret: '...',
        // },
        // 阿里云 OSS（S3 兼容）
        // {
        //     name: 'ali-oss',
        //     region: 'oss-cn-hangzhou',
        //     buckets: ['my-bucket', 'backup-bucket'],
        //     accessKeyId: 'your-access-key-id',
        //     accessKeySecret: 'your-access-key-secret',
        //     endpoint: 'https://oss-cn-hangzhou.aliyuncs.com',
        // },
        // MinIO
        // {
        //     name: 'minio',
        //     region: 'us-east-1',
        //     buckets: ['my-bucket'],
        //     accessKeyId: 'minioadmin',
        //     accessKeySecret: 'minioadmin',
        //     endpoint: 'http://192.168.1.10:9000',
        //     forcePathStyle: true,
        // },
    ],
};
