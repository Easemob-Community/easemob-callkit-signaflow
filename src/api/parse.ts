import express from 'express';

/**
 * 配置日志解析相关路由
 * @param app Express应用实例
 */
export function setupParseRoutes(app: express.Application) {
  // API路由：解析日志
  app.post('/api/parse', (req, res) => {
    res.json({
      message: '解析API已创建，具体实现将在后续添加',
      received: req.body
    });
  });
}
