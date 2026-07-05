import { NextResponse } from 'next/server';
import { getK3sConfig, listResources, createResource } from '../../../../../lib/k3s';

export async function GET(request, context) {
    const { cluster, ns, resourceType } = await context.params;
    const k3sConfig = getK3sConfig(cluster);
    if (!k3sConfig) {
        return NextResponse.json({ error: `未知的 K3S 集群: ${cluster}` }, { status: 404 });
    }
    try {
        const namespace = ns === 'all' ? null : ns;
        const resources = await listResources(k3sConfig, namespace, resourceType);
        return NextResponse.json({ resources });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request, context) {
    const { cluster, ns, resourceType } = await context.params;
    const k3sConfig = getK3sConfig(cluster);
    if (!k3sConfig) {
        return NextResponse.json({ error: `未知的 K3S 集群: ${cluster}` }, { status: 404 });
    }
    try {
        const body = await request.json();
        const namespace = ns === 'all' ? null : ns;
        const result = await createResource(k3sConfig, namespace, resourceType, body);
        return NextResponse.json(result);
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}