import { NextResponse } from 'next/server';
import { getAllK3sConfigs } from '../../../../lib/k3s';

export async function GET() {
    try {
        const clusters = getAllK3sConfigs();
        return NextResponse.json({ clusters });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}