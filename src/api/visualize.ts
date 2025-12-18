import express from 'express';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { SignalParser } from '../core/SignalParser.js';
import { Visualizer } from '../core/Visualizer.js';

/**
 * 配置可视化相关路由
 * @param app Express应用实例
 */
export function setupVisualizeRoutes(app: express.Application) {
  // API路由：可视化日志
  app.post('/api/visualize', app.locals.upload.single('logFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: '请上传日志文件' });
      }

      const file = req.file;
      const format = req.body.format || 'html';
      let logContent: string;

      // 检查文件扩展名
      const ext = path.extname(file.originalname).toLowerCase();
      
      // 处理.gz文件（解压缩）
      if (ext === '.gz') {
        const compressedData = fs.readFileSync(file.path);
        logContent = zlib.gunzipSync(compressedData).toString('utf8');
      } 
      // 处理.log和.txt文件
      else if (ext === '.log' || ext === '.txt') {
        logContent = fs.readFileSync(file.path, 'utf8');
      } 
      // 不支持的文件格式
      else {
        fs.unlinkSync(file.path); // 删除上传的文件
        return res.status(400).json({ error: '不支持的文件格式，请上传.log、.txt或.gz文件' });
      }

      // 删除临时文件
      fs.unlinkSync(file.path);

      // 解析日志内容
      const parser = new SignalParser();
      parser.parse(logContent);

      // 生成可视化报告
      const visualizer = new Visualizer(parser);
      const htmlContent = visualizer.generateHtml();

      // 返回HTML报告
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="callkit-signal-visualization.html"`);
      res.send(htmlContent);

    } catch (error) {
      console.error('可视化处理失败:', error);
      // 如果有临时文件，尝试删除
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (err) {
          console.error('删除临时文件失败:', err);
        }
      }
      res.status(500).json({ error: '生成可视化报告失败' });
    }
  });

  // API路由：从Mermaid数据生成HTML
  app.post('/api/mermaid-to-html', async (req, res) => {
    try {
      const { mermaidContent, outputFileName } = req.body;
      
      if (!mermaidContent) {
        return res.status(400).json({ error: '缺少mermaidContent参数' });
      }
      
      // 生成HTML内容
      const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mermaid序列图可视化报告</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      color: #007bff;
      border-bottom: 2px solid #eee;
      padding-bottom: 10px;
    }
    .mermaid-container {
      background: #f5f5f5;
      padding: 20px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <h1>Mermaid序列图可视化报告</h1>
  <div class="mermaid-container">
    <div class="mermaid">${mermaidContent}</div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  <script>
    mermaid.initialize({ startOnLoad: true, theme: 'default' });
  </script>
</body>
</html>
    `;
      
      // 设置响应头
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="${outputFileName || 'mermaid_report.html'}"`);
      
      // 返回HTML内容
      res.send(htmlContent);
      
    } catch (error) {
      console.error('生成HTML报告失败:', error);
      res.status(500).json({ error: '生成HTML报告失败' });
    }
  });
}
