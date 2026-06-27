# next-demo

基于 [Next.js](https://nextjs.org/)（Pages Router）+ React + Ant Design 的后台 / 工具箱应用。

## 开发

```bash
npm install
npm run dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。页面入口在 `pages/` 目录下，编辑后自动热更新。

## 部署（Node 服务）

采用 Next.js 标准的 Node 部署方式：先构建生产产物，再用 `next start` 启动 Node 服务。

```bash
npm run build
npm start
```

默认监听 `0.0.0.0:9393`（见 `package.json` 中 `start` 脚本，可按需修改端口）。

生产环境通常配合进程管理器（如 PM2）使用：

```bash
npm run build
pm2 start npm --name next-demo -- start
```

如需在容器中部署，典型 Dockerfile 片段：

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build
EXPOSE 9393
CMD ["npm", "start"]
```

## 目录结构

```
api/         # 前端请求封装
component/   # 通用组件（JSONEditor / JSONView / Table / WsClient …）
lib/         # 工具库（router / util / json）
pages/       # Next.js 页面
public/      # 静态资源
styles/      # 全局样式
```

## 了解更多

- [Next.js 文档](https://nextjs.org/docs) — 了解 Next.js 的特性与 API。
