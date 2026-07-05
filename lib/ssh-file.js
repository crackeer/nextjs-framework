// SSH 文件操作封装：基于 ssh2 库，通过 SFTP 协议实现文件管理
import { Client } from 'ssh2';
import { loadConfig } from './config.js';

// 根据名称查找 SSH 配置
export function getSshConfig(name) {
    const config = loadConfig();
    const sshConfig = (config.ssh || []).find((s) => s.name === name);
    if (!sshConfig) return null;
    return {
        host: sshConfig.host,
        port: sshConfig.port || 22,
        username: sshConfig.username,
        password: sshConfig.password,
        privateKey: sshConfig.privateKey,
    };
}

// 建立一次性 SSH 连接并执行 SFTP 操作后关闭
function withSftp(sshConfig, fn) {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        const connectOpts = {
            host: sshConfig.host,
            port: sshConfig.port,
            username: sshConfig.username,
            readyTimeout: 30000,
        };
        if (sshConfig.privateKey) {
            connectOpts.privateKey = sshConfig.privateKey;
        } else if (sshConfig.password) {
            connectOpts.password = sshConfig.password;
        }

        conn.on('ready', () => {
            conn.sftp((err, sftp) => {
                if (err) {
                    conn.end();
                    return reject(err);
                }
                Promise.resolve(fn(sftp))
                    .then((result) => {
                        conn.end();
                        resolve(result);
                    })
                    .catch((e) => {
                        conn.end();
                        reject(e);
                    });
            });
        });

        conn.on('error', (err) => {
            reject(err);
        });

        conn.connect(connectOpts);
    });
}

// 获取用户家目录（通过 SFTP realpath 解析 '.'）
export async function getHomeDir(sshConfig) {
    return withSftp(sshConfig, (sftp) => {
        return new Promise((resolve, reject) => {
            sftp.realpath('.', (err, absPath) => {
                if (err) return reject(err);
                resolve(absPath);
            });
        });
    });
}

// 列目录：返回 { name, isDirectory, size, modifiedAt, permissions }[]
export async function listDir(sshConfig, remotePath) {
    return withSftp(sshConfig, (sftp) => {
        return new Promise((resolve, reject) => {
            sftp.readdir(remotePath, (err, list) => {
                if (err) return reject(err);
                const items = list.map((it) => ({
                    name: it.filename,
                    isDirectory: it.longname.startsWith('d'),
                    size: it.attrs.size,
                    modifiedAt: it.attrs.mtime ? new Date(it.attrs.mtime * 1000).toISOString() : null,
                    permissions: it.longname.substring(0, 10),
                }));
                resolve(items);
            });
        });
    });
}

// 下载文件：返回 { stream, name, size, cleanup }（流式传输，需手动调用 cleanup 关闭连接）
export async function downloadFile(sshConfig, remotePath) {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        const connectOpts = {
            host: sshConfig.host,
            port: sshConfig.port,
            username: sshConfig.username,
            readyTimeout: 30000,
        };
        if (sshConfig.privateKey) {
            connectOpts.privateKey = sshConfig.privateKey;
        } else if (sshConfig.password) {
            connectOpts.password = sshConfig.password;
        }

        conn.on('ready', () => {
            conn.sftp((err, sftp) => {
                if (err) {
                    conn.end();
                    return reject(err);
                }
                sftp.stat(remotePath, (statErr, stats) => {
                    if (statErr) {
                        conn.end();
                        return reject(statErr);
                    }
                    const stream = sftp.createReadStream(remotePath);
                    const name = remotePath.split('/').filter(Boolean).pop() || 'download';
                    const cleanup = () => conn.end();
                    resolve({ stream, name, size: stats.size, cleanup });
                });
            });
        });

        conn.on('error', (err) => {
            reject(err);
        });

        conn.connect(connectOpts);
    });
}

// 上传文件：从 Buffer 上传到 remotePath
export async function uploadFile(sshConfig, remotePath, buffer) {
    return withSftp(sshConfig, (sftp) => {
        return new Promise((resolve, reject) => {
            const stream = sftp.createWriteStream(remotePath);
            stream.on('error', reject);
            stream.on('close', () => resolve());
            stream.end(buffer);
        });
    });
}

// 删除文件
export async function removeFile(sshConfig, remotePath) {
    return withSftp(sshConfig, (sftp) => {
        return new Promise((resolve, reject) => {
            sftp.unlink(remotePath, (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    });
}

// 删除目录（递归）
export async function removeDir(sshConfig, remotePath) {
    return withSftp(sshConfig, async (sftp) => {
        // 先获取目录内容
        const items = await new Promise((resolve, reject) => {
            sftp.readdir(remotePath, (err, list) => {
                if (err) return reject(err);
                resolve(list);
            });
        });

        // 递归删除内容
        for (const item of items) {
            const itemPath = remotePath.endsWith('/') 
                ? remotePath + item.filename 
                : remotePath + '/' + item.filename;
            if (item.longname.startsWith('d')) {
                await removeDir(sshConfig, itemPath);
            } else {
                await new Promise((resolve, reject) => {
                    sftp.unlink(itemPath, (err) => {
                        if (err) return reject(err);
                        resolve();
                    });
                });
            }
        }

        // 删除空目录
        return new Promise((resolve, reject) => {
            sftp.rmdir(remotePath, (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    });
}

// 重命名
export async function rename(sshConfig, fromPath, toPath) {
    return withSftp(sshConfig, (sftp) => {
        return new Promise((resolve, reject) => {
            sftp.rename(fromPath, toPath, (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    });
}

// 创建目录
export async function mkdir(sshConfig, remotePath) {
    return withSftp(sshConfig, (sftp) => {
        return new Promise((resolve, reject) => {
            sftp.mkdir(remotePath, (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    });
}
