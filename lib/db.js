import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { loadConfig } from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getDbPath() {
    const config = loadConfig();
    const dbRelPath = config.db?.path || 'data/commands.db';
    return path.join(process.cwd(), dbRelPath);
}

function ensureDir(dbPath) {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function readData() {
    const dbPath = getDbPath();
    if (!fs.existsSync(dbPath)) {
        return { commands: [], nextId: 1 };
    }
    try {
        return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    } catch {
        return { commands: [], nextId: 1 };
    }
}

function writeData(data) {
    const dbPath = getDbPath();
    ensureDir(dbPath);
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}

export default {
    async all(sql, params = []) {
        const data = readData();
        // 简单 SQL 解析支持
        if (sql.includes('SELECT') && sql.includes('ORDER BY')) {
            let results = [...data.commands];
            // WHERE 条件
            if (sql.includes('WHERE')) {
                const idMatch = sql.match(/WHERE\s+id\s*=\s*\?/);
                if (idMatch && params[0]) {
                    results = results.filter(c => c.id === params[0]);
                }
                const parentMatch = sql.match(/parent_id\s*=\s*\?/);
                if (parentMatch) {
                    const paramIndex = sql.indexOf('parent_id = ?');
                    const whereIndex = sql.indexOf('WHERE');
                    const paramCount = sql.slice(whereIndex, paramIndex).split('?').length - 1;
                    results = results.filter(c => c.parent_id === params[paramCount - 1] || (c.parent_id === null && params[paramCount - 1] === null));
                }
            }
            // 排序
            results.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.id - b.id);
            return results;
        }
        return [];
    },
    
    async get(sql, params = []) {
        const results = await this.all(sql, params);
        return results[0] || null;
    },
    
    async run(sql, params = []) {
        const data = readData();
        
        if (sql.includes('INSERT INTO')) {
            const command = {
                id: data.nextId++,
                name: params[0],
                command: params[1],
                parent_id: params[2] || null,
                sort_order: params[3] || 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            data.commands.push(command);
            writeData(data);
            return { lastInsertRowid: command.id };
        }
        
        if (sql.includes('UPDATE')) {
            const id = params[params.length - 1];
            const cmd = data.commands.find(c => c.id === id);
            if (cmd) {
                // 解析 SET 部分 - 支持 SET name = ?, command = ?, ...
                const setParts = sql.match(/SET\s+(.+?)\s+WHERE/s);
                if (setParts) {
                    const setClause = setParts[1];
                    let paramIndex = 0;
                    if (setClause.includes('name = ?')) cmd.name = params[paramIndex++];
                    if (setClause.includes('command = ?')) cmd.command = params[paramIndex++];
                    if (setClause.includes('parent_id = ?')) cmd.parent_id = params[paramIndex++];
                    if (setClause.includes('sort_order = ?')) cmd.sort_order = params[paramIndex++];
                }
                cmd.updated_at = new Date().toISOString();
                writeData(data);
            }
            return { lastInsertRowid: id };
        }
        
        if (sql.includes('DELETE FROM')) {
            const id = params[0];
            const deleteRecursive = (parentId) => {
                const children = data.commands.filter(c => c.parent_id === parentId);
                children.forEach(c => deleteRecursive(c.id));
                data.commands = data.commands.filter(c => c.id !== parentId);
            };
            deleteRecursive(id);
            writeData(data);
            return { lastInsertRowid: id };
        }
        
        return { lastInsertRowid: null };
    },
};