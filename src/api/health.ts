import express from 'express';

/**
 * 配置健康检查相关路由
 * @param app Express应用实例
 */
export function setupHealthRoutes(app: express.Application) {
  // 健康检查路由
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString()
    });
  });
}
