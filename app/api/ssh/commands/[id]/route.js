import { NextResponse } from 'next/server';
import db from '../../../../../lib/db';

// 获取单个命令
export async function GET(request, { params }) {
    try {
        const { id } = params;
        const command = await db.get('SELECT * FROM ssh_commands WHERE id = ?', [id]);
        
        if (!command) {
            return NextResponse.json({ error: 'Command not found' }, { status: 404 });
        }
        
        return NextResponse.json({ command });
    } catch (error) {
        console.error('Failed to get ssh command:', error);
        return NextResponse.json({ error: 'Failed to get command' }, { status: 500 });
    }
}

// 更新命令
export async function PUT(request, { params }) {
    try {
        const { id } = params;
        const body = await request.json();
        const { name, command, parent_id, sort_order } = body;
        
        const updates = [];
        const values = [];
        
        if (name !== undefined) {
            updates.push('name = ?');
            values.push(name);
        }
        if (command !== undefined) {
            updates.push('command = ?');
            values.push(command);
        }
        if (parent_id !== undefined) {
            updates.push('parent_id = ?');
            values.push(parent_id);
        }
        if (sort_order !== undefined) {
            updates.push('sort_order = ?');
            values.push(sort_order);
        }
        
        if (updates.length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }
        
        updates.push("updated_at = datetime('now')");
        values.push(id);
        
        await db.run(`
            UPDATE ssh_commands
            SET ${updates.join(', ')}
            WHERE id = ?
        `, values);
        
        const updated = await db.get('SELECT * FROM ssh_commands WHERE id = ?', [id]);
        
        return NextResponse.json({ command: updated });
    } catch (error) {
        console.error('Failed to update ssh command:', error);
        return NextResponse.json({ error: 'Failed to update command' }, { status: 500 });
    }
}

// 删除命令
export async function DELETE(request, { params }) {
    try {
        const { id } = params;
        
        // 先删除子命令（递归删除）
        const deleteRecursive = async (parentId) => {
            const children = await db.all('SELECT id FROM ssh_commands WHERE parent_id = ?', [parentId]);
            for (const child of children) {
                await deleteRecursive(child.id);
            }
            await db.run('DELETE FROM ssh_commands WHERE id = ?', [parentId]);
        };
        
        await deleteRecursive(id);
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete ssh command:', error);
        return NextResponse.json({ error: 'Failed to delete command' }, { status: 500 });
    }
}