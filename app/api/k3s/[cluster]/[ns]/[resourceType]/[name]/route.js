import { NextResponse } from 'next/server';
import { getK3sConfig, getResource, updateResource, deleteResource, rolloutResource } from '../../../../../../lib/k3s';

export async function GET(request, context) {
    const { cluster, ns, resourceType, name } = await context.params;
    const k3sConfig = getK3sConfig(cluster);
    if (!k3sConfig) {
        return NextResponse.json({ error: `未知的 K3S 集群: ${cluster}` }, { status: 404 });
    }
    try {
        const namespace = ns === 'all' ? null : ns;
        const resource = await getResource(k3sConfig, namespace, resourceType, name);
        return NextResponse.json(resource);
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PUT(request, context) {
    const { cluster, ns, resourceType, name } = await context.params;
    const k3sConfig = getK3sConfig(cluster);
    if (!k3sConfig) {
        return NextResponse.json({ error: `未知的 K3S 集群: ${cluster}` }, { status: 404 });
    }
    try {
        const body = await request.json();
        const namespace = ns === 'all' ? null : ns;
        const result = await updateResource(k3sConfig, namespace, resourceType, name, body);
        return NextResponse.json(result);
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(request, context) {
    const { cluster, ns, resourceType, name } = await context.params;
    const k3sConfig = getK3sConfig(cluster);
    if (!k3sConfig) {
        return NextResponse.json({ error: `未知的 K3S 集群: ${cluster}` }, { status: 404 });
    }
    try {
        const namespace = ns === 'all' ? null : ns;
        await deleteResource(k3sConfig, namespace, resourceType, name);
        return NextResponse.json({ ok: true });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request, context) {
    const { cluster, ns, resourceType, name } = await context.params;
    const k3sConfig = getK3sConfig(cluster);
    if (!k3sConfig) {
        return NextResponse.json({ error: `未知的 K3S 集群: ${cluster}` }, { status: 404 });
    }
    try {
        const action = request.nextUrl.searchParams.get('action');
        if (action === 'rollout') {
            await rolloutResource(k3sConfig, ns, resourceType, name);
            return NextResponse.json({ ok: true });
        }
        return NextResponse.json({ error: '未知操作' }, { status: 400 });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}