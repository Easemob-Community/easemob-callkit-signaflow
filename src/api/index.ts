import express from 'express';
import { setupVisualizeRoutes } from './visualize.js';
import { setupParseRoutes } from './parse.js';
import { setupHealthRoutes } from './health.js';

/**
 * 配置所有API路由
 * @param app Express应用实例
 */
export function setupApiRoutes(app: express.Application) {
  // 可视化相关路由
  setupVisualizeRoutes(app);
  
  // 日志解析相关路由
  setupParseRoutes(app);
  
  // 健康检查路由
  setupHealthRoutes(app);
}
