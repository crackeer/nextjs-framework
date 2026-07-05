import { loadConfig } from './config';
import { createPool } from 'mysql2/promise';

const pools = new Map();

function getConfigByName(hostName) {
    const config = loadConfig();
    return (config.mysql || []).find((m) => m.name === hostName);
}

async function getPool(hostName) {
    if (pools.has(hostName)) {
        return pools.get(hostName);
    }

    const mysqlConfig = getConfigByName(hostName);
    if (!mysqlConfig) {
        throw new Error(`未找到 MySQL 配置: ${hostName}`);
    }

    const pool = createPool({
        host: mysqlConfig.host,
        port: mysqlConfig.port || 3306,
        user: mysqlConfig.username,
        password: mysqlConfig.password,
        database: mysqlConfig.database || undefined,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        charset: 'utf8mb4',
    });

    pools.set(hostName, pool);
    return pool;
}

async function getConnection(hostName) {
    const pool = await getPool(hostName);
    return pool.getConnection();
}

export { getConfigByName, getPool, getConnection };
