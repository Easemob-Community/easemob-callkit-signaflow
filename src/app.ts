import express from 'express';
import path from 'path';

const app = express();

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
          <input type="file" name="logFile" accept=".log,.txt" required>
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

// API路由：可视化日志
app.post('/api/visualize', (req, res) => {
  res.json({
    message: '可视化API已创建，具体实现将在后续添加',
    received: {
      format: req.body.format || 'html',
      // file: req.file // 文件上传处理将在后续实现
    }
  });
});

// API路由：解析日志
app.post('/api/parse', (req, res) => {
  res.json({
    message: '解析API已创建，具体实现将在后续添加',
    received: req.body
  });
});

// 健康检查路由
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
export function startServer(port: number = 3000) {
  app.listen(port, () => {
    console.log(`环信CallKit信令可视化服务已启动`);
    console.log(`访问地址: http://localhost:${port}`);
    console.log(`健康检查: http://localhost:${port}/health`);
  });
}

// 如果直接运行此文件，启动默认端口服务
if (require.main === module) {
  startServer();
}
