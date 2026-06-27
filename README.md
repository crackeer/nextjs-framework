# next-demo

基于 [Next.js](https://nextjs.org/)（Pages Router）+ React + Ant Design 的后台 / 工具箱应用。

## 开发

```bash
npm install
npm run dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。页面入口在 `pages/` 目录下，编辑后自动热更新。

## 部署（standalone 模式）

项目已开启 Next.js 的 `output: 'standalone'`（见 [next.config.js](next.config.js)）。构建后会生成一个**自包含的最小化运行包** `.next/standalone/`，内含精简后的 `node_modules` 与入口 `server.js`，复制到任何装了 Node 的机器即可直接运行，无需再 `npm install`。

```bash
npm run build       # 构建并自动执行 postbuild：把 public/ 和 .next/static 复制进 standalone
npm start           # 等价于 node .next/standalone/server.js
```

默认监听 `0.0.0.0:3000`，可通过环境变量覆盖端口 / 主机：

```bash
PORT=9393 HOSTNAME=0.0.0.0 npm start
```

> 说明：standalone 产物默认不含 `public/` 与 `.next/static`，由 [scripts/postbuild.js](scripts/postbuild.js) 在构建后自动补齐，无需手动处理。

### Docker 部署

利用 standalone 模式可得到极小的运行镜像（只复制 standalone 产物，无需在运行镜像里装依赖）：

```dockerfile
# ---------- 1. 构建阶段 ----------
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---------- 2. 运行阶段 ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=9393
ENV HOSTNAME=0.0.0.0
# standalone 已自带精简 node_modules、public、.next/static
COPY --from=builder /app/.next/standalone ./
EXPOSE 9393
CMD ["node", "server.js"]
```

```bash
docker build -t next-demo .
docker run -p 9393:9393 next-demo
```

## 目录结构

```
api/         # 前端请求封装
component/   # 通用组件（JSONEditor / JSONView / Table / WsClient …）
lib/         # 工具库（router / util / json）
pages/       # Next.js 页面
public/      # 静态资源
scripts/     # 构建辅助脚本（postbuild）
styles/      # 全局样式
```

## 了解更多

- [Next.js 文档](https://nextjs.org/docs) — 了解 Next.js 的特性与 API。
- [Next.js standalone 模式](https://nextjs.org/docs/app/api-reference/next-config-js/output) — standalone 输出说明。
