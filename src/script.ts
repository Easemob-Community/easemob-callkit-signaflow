#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import { SignalParser } from './core/SignalParser.js';
import { Visualizer } from './core/Visualizer.js';

const mkdir = promisify(fs.mkdir);
const exists = promisify(fs.exists);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
// 获取当前目录
const __dirname = path.dirname(__filename);

/**
 * 一键式处理脚本
 * 1. 读取output目录下的.txt文件
 * 2. 解析日志文件
 * 3. 生成可视化HTML报告
 * 4. 输出到output目录
 */
async function main() {
  try {
    // 创建output目录（如果不存在）
    const outputDir = path.join(__dirname, '../output');
    if (!(await exists(outputDir))) {
      await mkdir(outputDir, { recursive: true });
      console.log(`已创建output目录: ${outputDir}`);
    }
    
    // 读取output目录下的所有.txt文件
    const files = await readdir(outputDir);
    let processedFiles: string[] = [];
    
    for (const file of files) {
      const filePath = path.join(outputDir, file);
      const fileStats = await stat(filePath);
      if (fileStats.isFile() && path.extname(file).toLowerCase() === '.txt') {
        processedFiles.push(filePath);
      }
    }
    
    if (processedFiles.length === 0) {
      console.error('在output目录下未找到可处理的.txt日志文件');
      process.exit(1);
    }
    
    console.log(`找到 ${processedFiles.length} 个处理后的日志文件`);
    
    // 处理每个日志文件
    for (const logFile of processedFiles) {
      console.log(`\n开始处理日志文件: ${logFile}`);
      
      // 解析日志
      const parser = new SignalParser();
      await parser.parseLogFile(logFile);
      
      // 生成可视化报告
      const visualizer = new Visualizer(parser);
      
      // 生成合理的文件名
      const baseName = path.basename(logFile, path.extname(logFile));
      const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
      const outputFileName = `callkit_report_${baseName}_${timestamp}.html`;
      const outputFilePath = path.join(outputDir, outputFileName);
      
      // 生成HTML报告
      await visualizer.generateHtmlReport(outputFilePath);
      
      console.log(`HTML报告已生成: ${outputFilePath}`);
    }
    
    console.log('\n所有文件处理完成！');
    console.log(`报告输出目录: ${outputDir}`);
    
  } catch (error) {
    console.error('处理过程中发生错误:', error);
    process.exit(1);
  }
}

// 执行主函数
main();
