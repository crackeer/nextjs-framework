import { NextResponse } from 'next/server';
import { getK3sConfig, getNamespaces } from '../../../../lib/k3s';

export async function GET(request, context) {
    const { cluster } = await context.params;
    const k3sConfig = getK3sConfig(cluster);
    if (!k3sConfig) {
        return NextResponse.json({ error: `未知的 K3S 集群: ${cluster}` }, { status: 404 });
    }
    try {
        const namespaces = await getNamespaces(k3sConfig);
        const result = namespaces.map((ns) => ({
            name: ns.metadata.name,
            status: ns.status?.phase || 'Active',
            labels: ns.metadata.labels || {},
        }));
        return NextResponse.json({ namespaces: result });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}