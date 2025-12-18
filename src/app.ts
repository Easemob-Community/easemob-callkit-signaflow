import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { setupApiRoutes } from './api/index.js';

// 在ES模块中替代__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 配置multer中间件处理文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../temp'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 限制文件大小为50MB
  }
});

// 将upload对象挂载到app上，以便在路由中使用
app.locals.upload = upload;

// 静态文件服务
app.use(express.static(path.join(__dirname, '../public')));

// 解析JSON请求体
app.use(express.json({ limit: '50mb' }));

// 解析URL编码请求体
app.use(express.urlencoded({ extended: true }));

// 主页路由
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>环信CallKit信令可视化工具</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          text-align: center;
        }
        h1 {
          color: #333;
        }
        .upload-section {
          margin: 2rem 0;
          padding: 2rem;
          border: 2px dashed #ccc;
          border-radius: 8px;
        }
        input[type="file"] {
          margin: 1rem 0;
        }
        button {
          padding: 0.5rem 1rem;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
        }
        button:hover {
          background-color: #0056b3;
        }
        .result-section {
          margin: 2rem 0;
          padding: 1rem;
          background-color: #f8f9fa;
          border-radius: 8px;
          min-height: 200px;
        }
      </style>
    </head>
    <body>
      <h1>环信CallKit信令可视化工具</h1>
      <div class="upload-section">
        <h2>上传信令日志文件</h2>
        <form action="/api/visualize" method="post" enctype="multipart/form-data">
          <input type="file" name="logFile" accept=".log,.txt,.gz" required>
          <br>
          <label>
            报告格式: 
            <select name="format">
              <option value="html">HTML</option>
              <option value="mermaid">Mermaid</option>
            </select>
          </label>
          <br><br>
          <button type="submit">生成可视化报告</button>
        </form>
      </div>
      <div class="result-section">
        <h2>可视化结果</h2>
        <p>上传日志文件后，可视化结果将显示在这里</p>
      </div>
    </body>
    </html>
  `);
});

// 引入并配置所有API路由
setupApiRoutes(app);

// 启动服务器
export function startServer(port: number = 3000) {
  app.listen(port, () => {
    console.log(`环信CallKit信令可视化服务已启动`);
    console.log(`访问地址: http://localhost:${port}`);
    console.log(`健康检查: http://localhost:${port}/health`);
  });
}

// 如果直接运行此文件，启动默认端口服务
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}
