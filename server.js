const express = require("express");
const next = require("next");
const dev = process.env.NODE_ENV !== "production"; //判断是否开发环境
const app = next({ dev }); //创建一个next的app
const handle = app.getRequestHandler(); //请求处理

app.prepare()
const server = express();

//用来进行简化路径匹配
server.get("/b/:currentBookId", (req, res) => {
  const actualPage = "/book/[currentBookId]";
  const queryParams = { currentBookId: req.params.currentBookId };
  app.render(req, res, actualPage, queryParams);
});

server.get("*", (req, res) => {
  return handle(req, res);
});

server.listen(8080, err => {
  if (err) throw err;
  console.log("> Ready on http://localhost:6776");
});
  