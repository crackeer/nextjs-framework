import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { loadConfig } from './config.js';

export function getK3sConfig(name) {
    const config = loadConfig();
    const k3sConfig = (config.k3s || []).find((k) => k.name === name);
    if (!k3sConfig) return null;
    return k3sConfig;
}

export function getAllK3sConfigs() {
    const config = loadConfig();
    return config.k3s || [];
}

function parseKubeConfig(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const config = JSON.parse(content);

    const currentContext = config['current-context'];
    const context = config.contexts.find((c) => c.name === currentContext);
    if (!context) throw new Error(`Context "${currentContext}" not found`);

    const clusterName = context.context.cluster;
    const userName = context.context.user;

    const cluster = config.clusters.find((c) => c.name === clusterName);
    if (!cluster) throw new Error(`Cluster "${clusterName}" not found`);

    const user = config.users.find((u) => u.name === userName);
    if (!user) throw new Error(`User "${userName}" not found`);

    let auth = {};
    if (user.user.token) {
        auth = { type: 'token', token: user.user.token };
    } else if (user.user['client-certificate-data'] && user.user['client-key-data']) {
        auth = {
            type: 'cert',
            cert: Buffer.from(user.user['client-certificate-data'], 'base64').toString(),
            key: Buffer.from(user.user['client-key-data'], 'base64').toString(),
        };
    } else if (user.user.username && user.user.password) {
        auth = { type: 'basic', username: user.user.username, password: user.user.password };
    }

    let caCert;
    if (cluster.cluster['certificate-authority-data']) {
        caCert = Buffer.from(cluster.cluster['certificate-authority-data'], 'base64').toString();
    }

    return {
        server: cluster.cluster.server,
        auth,
        caCert,
        insecureSkipTlsVerify: cluster.cluster['insecure-skip-tls-verify'] || false,
    };
}

async function k8sRequest(config, method, apiPath, body = null) {
    return new Promise((resolve, reject) => {
        const parsed = new URL(config.server + apiPath);
        const isHttps = parsed.protocol === 'https:';
        const options = {
            protocol: parsed.protocol,
            hostname: parsed.hostname,
            port: parsed.port || (isHttps ? 443 : 80),
            path: parsed.pathname + parsed.search,
            method: method.toUpperCase(),
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (config.caCert) {
            options.ca = config.caCert;
        }
        if (config.insecureSkipTlsVerify) {
            options.rejectUnauthorized = false;
        }

        if (config.auth.type === 'token') {
            options.headers.Authorization = `Bearer ${config.auth.token}`;
        } else if (config.auth.type === 'cert') {
            options.cert = config.auth.cert;
            options.key = config.auth.key;
        } else if (config.auth.type === 'basic') {
            const creds = `${config.auth.username}:${config.auth.password}`;
            options.headers.Authorization = `Basic ${Buffer.from(creds).toString('base64')}`;
        }

        const httpModule = isHttps ? https : http;
        const req = httpModule.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                try {
                    const json = data ? JSON.parse(data) : {};
                    if (res.statusCode >= 400) {
                        reject(new Error(json.message || `HTTP ${res.statusCode}`));
                    } else {
                        resolve(json);
                    }
                } catch (err) {
                    reject(new Error('Failed to parse response: ' + err.message));
                }
            });
        });

        req.on('error', reject);
        if (body) {
            req.write(typeof body === 'string' ? body : JSON.stringify(body));
        }
        req.end();
    });
}

export async function getNamespaces(k3sConfig) {
    const kubeConfig = parseKubeConfig(k3sConfig.kubeConfig);
    const result = await k8sRequest(kubeConfig, 'GET', '/api/v1/namespaces');
    return result.items || [];
}

const RESOURCE_API_MAP = {
    pods: { api: 'v1', path: 'pods' },
    services: { api: 'v1', path: 'services' },
    configmaps: { api: 'v1', path: 'configmaps' },
    secrets: { api: 'v1', path: 'secrets' },
    deployments: { api: 'apps/v1', path: 'deployments' },
    statefulsets: { api: 'apps/v1', path: 'statefulsets' },
    daemonsets: { api: 'apps/v1', path: 'daemonsets' },
    replicasets: { api: 'apps/v1', path: 'replicasets' },
    ingresses: { api: 'networking.k8s.io/v1', path: 'ingresses' },
    persistentvolumeclaims: { api: 'v1', path: 'persistentvolumeclaims' },
    persistentvolumes: { api: 'v1', path: 'persistentvolumes' },
    nodes: { api: 'v1', path: 'nodes' },
    namespaces: { api: 'v1', path: 'namespaces' },
};

export function getResourceApiPath(resourceType) {
    return RESOURCE_API_MAP[resourceType];
}

export async function listResources(k3sConfig, namespace, resourceType) {
    const kubeConfig = parseKubeConfig(k3sConfig.kubeConfig);
    const apiDef = getResourceApiPath(resourceType);
    if (!apiDef) throw new Error(`Unsupported resource type: ${resourceType}`);

    let path = `/apis/${apiDef.api}/${apiDef.path}`;
    if (namespace && namespace !== 'all') {
        path = `/apis/${apiDef.api}/namespaces/${namespace}/${apiDef.path}`;
    }

    const result = await k8sRequest(kubeConfig, 'GET', path);
    return result.items || [];
}

export async function getResource(k3sConfig, namespace, resourceType, name) {
    const kubeConfig = parseKubeConfig(k3sConfig.kubeConfig);
    const apiDef = getResourceApiPath(resourceType);
    if (!apiDef) throw new Error(`Unsupported resource type: ${resourceType}`);

    let path = `/apis/${apiDef.api}/${apiDef.path}/${name}`;
    if (namespace && namespace !== 'all') {
        path = `/apis/${apiDef.api}/namespaces/${namespace}/${apiDef.path}/${name}`;
    }

    return await k8sRequest(kubeConfig, 'GET', path);
}

export async function deleteResource(k3sConfig, namespace, resourceType, name) {
    const kubeConfig = parseKubeConfig(k3sConfig.kubeConfig);
    const apiDef = getResourceApiPath(resourceType);
    if (!apiDef) throw new Error(`Unsupported resource type: ${resourceType}`);

    let path = `/apis/${apiDef.api}/${apiDef.path}/${name}`;
    if (namespace && namespace !== 'all') {
        path = `/apis/${apiDef.api}/namespaces/${namespace}/${apiDef.path}/${name}`;
    }

    return await k8sRequest(kubeConfig, 'DELETE', path);
}

export async function updateResource(k3sConfig, namespace, resourceType, name, body) {
    const kubeConfig = parseKubeConfig(k3sConfig.kubeConfig);
    const apiDef = getResourceApiPath(resourceType);
    if (!apiDef) throw new Error(`Unsupported resource type: ${resourceType}`);

    let path = `/apis/${apiDef.api}/${apiDef.path}/${name}`;
    if (namespace && namespace !== 'all') {
        path = `/apis/${apiDef.api}/namespaces/${namespace}/${apiDef.path}/${name}`;
    }

    return await k8sRequest(kubeConfig, 'PUT', path, body);
}

export async function rolloutResource(k3sConfig, namespace, resourceType, name) {
    const kubeConfig = parseKubeConfig(k3sConfig.kubeConfig);
    
    if (resourceType !== 'deployments') {
        throw new Error('Rollout only supported for deployments');
    }

    const path = `/apis/apps/v1/namespaces/${namespace}/deployments/${name}/rollout/restart`;
    return await k8sRequest(kubeConfig, 'POST', path);
}

export async function createResource(k3sConfig, namespace, resourceType, body) {
    const kubeConfig = parseKubeConfig(k3sConfig.kubeConfig);
    const apiDef = getResourceApiPath(resourceType);
    if (!apiDef) throw new Error(`Unsupported resource type: ${resourceType}`);

    let path = `/apis/${apiDef.api}/${apiDef.path}`;
    if (namespace && namespace !== 'all') {
        path = `/apis/${apiDef.api}/namespaces/${namespace}/${apiDef.path}`;
    }

    return await k8sRequest(kubeConfig, 'POST', path, body);
}