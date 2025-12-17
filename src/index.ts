#!/usr/bin/env node

import { program } from 'commander';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
// 获取当前目录
const __dirname = path.dirname(__filename);

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
      const { startServer } = await import('./app.js');
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
  .action(async (logFile: string, options: { output?: string }) => {
    try {
      const { SignalParser } = await import('./core/SignalParser.js');
      
      console.log(`解析日志文件: ${logFile}`);
      
      // 解析日志文件
      const parser = new SignalParser();
      await parser.parseLogFile(logFile);
      
      // 导出到JSON文件
      const outputFilePath = await parser.exportToJson(options.output);
      
      // 输出统计信息
      const statistics = parser.getCallTypeStatistics();
      console.log('\n解析完成!');
      console.log(`总共提取到 ${parser.getRtcCallLogs().length} 条rtcCallWithAgora日志`);
      console.log(`按callId分为 ${parser.getCallIdToLogsMap().size} 个通话会话`);
      
      console.log('\n通话类型统计:');
      console.log(`一对一通话: ${statistics.oneToOne} 个`);
      console.log(`群组通话: ${statistics.group} 个`);
      console.log(`未知类型: ${statistics.unknown} 个`);
      
      console.log(`\n解析后的数据已输出到: ${outputFilePath}`);
      
    } catch (error) {
      console.error('解析日志文件失败:', error);
      process.exit(1);
    }
  });

// 生成可视化报告命令
program
  .command('visualize <logFile>')
  .description('生成信令可视化报告')
  .option('-f, --format <format>', '报告格式 (html/mermaid)', 'html')
  .option('-o, --output <outputFile>', '输出文件路径')
  .action(async (logFile: string, options: { format?: string; output?: string }) => {
    try {
      const { SignalParser } = await import('./core/SignalParser.js');
      const { Visualizer } = await import('./core/Visualizer.js');
      
      console.log(`生成可视化报告: ${logFile}`);
      console.log(`报告格式: ${options.format || 'html'}`);
      
      // 解析日志文件
      const parser = new SignalParser();
      await parser.parseLogFile(logFile);
      
      // 生成可视化报告
      const visualizer = new Visualizer(parser);
      const outputFilePath = await visualizer.writeToFile(
        options.format || 'html',
        options.output || `${path.basename(logFile, path.extname(logFile))}.${options.format || 'html'}`
      );
      
      console.log(`可视化报告已生成: ${outputFilePath}`);
      console.log(`报告格式: ${options.format || 'html'}`);
      
    } catch (error) {
      console.error('生成可视化报告失败:', error);
      process.exit(1);
    }
  });

// 从Mermaid数据生成HTML报告命令
program
  .command('mermaid-to-html <mermaidFile>')
  .description('将Mermaid序列图数据转换为HTML报告')
  .option('-o, --output <outputFile>', '输出HTML文件路径')
  .action(async (mermaidFile: string, options: { output?: string }) => {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const { fileURLToPath } = await import('url');
      
      // 读取Mermaid数据文件
      const mermaidContent = await fs.readFile(mermaidFile, 'utf-8');
      
      // 生成HTML报告
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
    pre {
      margin: 0;
      white-space: pre-wrap;
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
      
      // 确定输出文件路径
      const outputFilePath = options.output || path.join(process.cwd(), `${path.basename(mermaidFile, path.extname(mermaidFile))}.html`);
      
      // 写入HTML文件
      await fs.writeFile(outputFilePath, htmlContent, 'utf-8');
      
      console.log(`HTML报告已生成: ${outputFilePath}`);
      
    } catch (error) {
      console.error('生成HTML报告失败:', error);
      process.exit(1);
    }
  });

// 解析命令行参数
program.parse(process.argv);

// 如果没有提供命令，显示帮助信息
if (!program.args.length) {
  program.help();
}
