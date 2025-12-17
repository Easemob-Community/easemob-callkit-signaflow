#!/usr/bin/env node

import { program } from 'commander';
import fs from 'fs';
import path from 'path';

// 从package.json获取版本信息
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8'));

// CLI命令定义
program
  .version(packageJson.version)
  .description('环信CallKit信令跟踪可视化工具');

// 启动Web服务命令
program
  .command('serve')
  .description('启动信令可视化Web服务')
  .option('-p, --port <port>', '服务端口', '3000')
  .action(async (options: { port?: string }) => {
    try {
      const { startServer } = await import('./app');
      startServer(Number(options.port));
    } catch (error) {
      console.error('启动服务失败:', error);
      process.exit(1);
    }
  });

// 解析日志文件命令
program
  .command('parse <logFile>')
  .description('解析信令日志文件')
  .option('-o, --output <outputFile>', '输出文件路径')
  .action((logFile: string, options: { output?: string }) => {
    console.log(`解析日志文件: ${logFile}`);
    console.log(`输出文件: ${options.output || 'stdout'}`);
    // 具体解析逻辑将在后续实现
  });

// 生成可视化报告命令
program
  .command('visualize <logFile>')
  .description('生成信令可视化报告')
  .option('-f, --format <format>', '报告格式 (html/mermaid)', 'html')
  .option('-o, --output <outputFile>', '输出文件路径')
  .action((logFile: string, options: { format?: string; output?: string }) => {
    console.log(`生成可视化报告: ${logFile}`);
    console.log(`报告格式: ${options.format}`);
    console.log(`输出文件: ${options.output || `${path.basename(logFile, path.extname(logFile))}.${options.format}`}`);
    // 具体可视化逻辑将在后续实现
  });

// 解析命令行参数
program.parse(process.argv);

// 如果没有提供命令，显示帮助信息
if (!program.args.length) {
  program.help();
}
