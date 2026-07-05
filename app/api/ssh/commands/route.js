import { NextResponse } from 'next/server';
import db from '../../../../lib/db';

// 获取所有快捷命令（树状结构）
export async function GET() {
    try {
        const commands = await db.all(`
            SELECT id, name, command, parent_id, sort_order, created_at, updated_at
            FROM ssh_commands
            ORDER BY sort_order, id
        `);
        
        // 构建树状结构
        const commandMap = new Map();
        const roots = [];
        
        commands.forEach(cmd => {
            commandMap.set(cmd.id, { ...cmd, children: [] });
        });
        
        commands.forEach(cmd => {
            const node = commandMap.get(cmd.id);
            if (cmd.parent_id === null || cmd.parent_id === 0) {
                roots.push(node);
            } else {
                const parent = commandMap.get(cmd.parent_id);
                if (parent) {
                    parent.children.push(node);
                }
            }
        });
        
        return NextResponse.json({ commands: roots });
    } catch (error) {
        console.error('Failed to get ssh commands:', error);
        return NextResponse.json({ error: 'Failed to get commands' }, { status: 500 });
    }
}

// 创建新命令
export async function POST(request) {
    try {
        const body = await request.json();
        const { name, command, parent_id, sort_order = 0 } = body;
        
        if (!name || !command) {
            return NextResponse.json({ error: 'Name and command are required' }, { status: 400 });
        }
        
        const result = await db.run(`
            INSERT INTO ssh_commands (name, command, parent_id, sort_order)
            VALUES (?, ?, ?, ?)
        `, [name, command, parent_id || null, sort_order]);
        
        const newCommand = await db.get('SELECT * FROM ssh_commands WHERE id = ?', [result.lastInsertRowid]);
        
        return NextResponse.json({ command: newCommand });
    } catch (error) {
        console.error('Failed to create ssh command:', error);
        return NextResponse.json({ error: 'Failed to create command' }, { status: 500 });
    }
}