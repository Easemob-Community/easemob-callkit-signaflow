import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { ParsedLogInfo, SignalParser } from './SignalParser';

const writeFile = promisify(fs.writeFile);

/**
 * 可视化生成器类
 * 用于将解析后的信令日志生成可视化报告
 */
export class Visualizer {
  private parser: SignalParser;

  constructor(parser: SignalParser) {
    this.parser = parser;
  }



  /**
   * 生成HTML报告
   * @returns HTML字符串
   */
  generateHtml(): string {
    const statistics = this.parser.getCallTypeStatistics();
    const allCalls = Array.from(this.parser.getCallIdToLogsMap().entries());

    // HTML模板
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>环信CallKit信令可视化报告</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    

    
    /* 通话ID列表样式 */
    .call-id-list {
      margin: 20px 0;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .call-id-list ul {
      list-style-type: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .call-id-list li {
      background: white;
      padding: 8px 15px;
      border-radius: 5px;
      border: 1px solid #ddd;
      transition: all 0.3s;
    }
    .call-id-list li:hover {
      background: #e9ecef;
      border-color: #007bff;
    }
    .call-id-list a {
      text-decoration: none;
      color: #007bff;
      font-weight: 500;
    }
    /* 通话类型标识样式 */
    .call-type-badge {
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: bold;
      margin-right: 5px;
    }
    .call-type-badge.oneToOne {
      background: #d4edda;
      color: #155724;
    }
    .call-type-badge.group {
      background: #cce5ff;
      color: #004085;
    }
    .call-type-badge.unknown {
      background: #f8d7da;
      color: #721c24;
    }
    h1 {
      color: #007bff;
      border-bottom: 2px solid #eee;
      padding-bottom: 10px;
      text-align: center;
    }
    h2 {
      color: #555;
      margin-top: 30px;
    }
    h3 {
      color: #666;
      margin-top: 20px;
    }
    .statistics {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      margin: 20px 0;
    }
    .stat-card {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      flex: 1;
      min-width: 200px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .stat-card h3 {
      margin-top: 0;
      color: #007bff;
    }
    .call-section {
      margin: 30px 0;
      padding: 20px;
      border: 1px solid #eee;
      border-radius: 8px;
      background: #fff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      display: none;
    }
    .call-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    }
    .call-meta {
      display: flex;
      gap: 20px;
    }
    .call-type {
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: bold;
    }
    .call-type.oneToOne {
      background: #d4edda;
      color: #155724;
    }
    .call-type.group {
      background: #cce5ff;
      color: #004085;
    }
    .call-type.unknown {
      background: #f8d7da;
      color: #721c24;
    }
    .mermaid-container {
      background: #f5f5f5;
      padding: 20px;
      border-radius: 8px;
      overflow-x: auto;
    }
    pre {
      margin: 0;
      white-space: pre-wrap;
    }
    .log-list {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin-top: 15px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
    }
    .log-item {
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid #eee;
    }
    .log-item:last-child {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }
    .log-action {
      font-weight: bold;
      color: #007bff;
    }
    .log-time {
      color: #666;
      font-size: 12px;
    }
    
    /* 原始日志展示样式 */
    .raw-log-container {
      margin-top: 8px;
      padding: 8px;
      background: #f5f5f5;
      border-radius: 4px;
      overflow-x: auto;
      max-width: 100%;
      border: 1px solid #e9ecef;
    }
    .raw-log {
      white-space: pre-wrap;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      margin: 0;
      color: #333;
      line-height: 1.5;
    }
    .raw-log::-webkit-scrollbar {
      height: 8px;
    }
    .raw-log::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }
    .raw-log::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 4px;
    }
    .raw-log::-webkit-scrollbar-thumb:hover {
      background: #555;
    }


    /* 通话类型显示控制 */
    .call-section.oneToOne { display: block; }
    .call-section.group { display: block; }
    .call-section.unknown { display: block; }
  </style>
</head>
<body>
  <h1>环信CallKit信令可视化报告</h1>
  <h2>SDK版本: ${this.parser.getCoreVersion() || '未知'} | Git Commit: ${this.parser.getGitCommit() || '未知'}</h2>
  
  <h2>整体统计</h2>
  <div class="statistics">
    <div class="stat-card">
      <h3>总通话数</h3>
      <p style="font-size: 24px; font-weight: bold;">${statistics.total}</p>
    </div>
    <div class="stat-card">
      <h3>一对一通话</h3>
      <p style="font-size: 24px; font-weight: bold;">${statistics.oneToOne}</p>
    </div>
    <div class="stat-card">
      <h3>群组通话</h3>
      <p style="font-size: 24px; font-weight: bold;">${statistics.group}</p>
    </div>
    <div class="stat-card">
      <h3>未知类型</h3>
      <p style="font-size: 24px; font-weight: bold;">${statistics.unknown}</p>
    </div>
  </div>

  <h2>通话会话详情</h2>
  
  <!-- 所有通话ID列表 -->
  <div class="call-id-list">
    <h3>所有通话ID</h3>
    <ul>
      ${allCalls.map(([callId]) => {
        const callType = this.parser.getCallType(callId) || 'unknown';
        const typeText = callType === 'oneToOne' ? '一对一' : callType === 'group' ? '群组' : '未知';
        return `
        <li><span class="call-type-badge ${callType}">[${typeText}]</span> <a href="#${callId}">${callId}</a></li>
        `;
      }).join('')}
    </ul>
  </div>
  
  ${allCalls.map(([callId, logs]) => {
    const callType = this.parser.getCallType(callId) || 'unknown';
    const sortedLogs = [...logs].sort((a, b) => {
      const t1 = a.msgTimestamp || a.ts;
      const t2 = b.msgTimestamp || b.ts;
      return t1 - t2;
    });
    return `
    <div class="call-section ${callType}" id="${callId}" data-callid="${callId}" data-calltype="${callType}">
      <div class="call-header">
        <h3>通话ID: ${callId}</h3>
        <div class="call-meta">
          <span class="call-type ${callType}">${callType === 'oneToOne' ? '一对一' : callType === 'group' ? '群组' : '未知'}</span>
          <span>日志数: ${logs.length}</span>
        </div>
      </div>
      
      <h4>信令序列图</h4>
      <div class="mermaid-container">
        <div class="mermaid">${this.generateMermaidForCall(logs)}</div>
      </div>
      
      <h4>信令日志详情</h4>
      <!-- 说明：msgTimestamp 是消息的timestamp值，ts 是信令内的时间戳 -->
      <div class="log-list">
        ${sortedLogs.map((log, index) => `
        <div class="log-item">
          <span class="log-action">${log.action}</span>
          <span> from ${log.from} to ${log.to} </span>
          <span> ${log.msgTimestamp ? 'messageTime：' + this.formatTimestamp(log.msgTimestamp) : '信令内time：' + this.formatTimestamp(log.ts)} </span>
          ${log.rawLog ? `<div class="raw-log-container"><pre class="raw-log">${log.rawLog}</pre></div>` : ''}
        </div>`).join('')}
      </div>
    </div>`;
  }).join('')}

  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  <script>
    // 等待DOM加载完成后初始化Mermaid
    document.addEventListener('DOMContentLoaded', function() {
      mermaid.initialize({ theme: 'default' });
      mermaid.contentLoaded();
    });
  </script>
</body>
</html>
    `;
  }

  /**
   * 格式化时间戳
   * 将毫秒级时间戳转换为年 月 日 24小时制 分钟:秒.毫秒格式
   * @param ts 毫秒级时间戳
   * @returns 格式化后的时间字符串，例如：2025 12 17 14:46:42.106
   */
  private formatTimestamp(ts: number): string {
    const date = new Date(ts);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
    return `${year}-${month}-${day}/${hours}:${minutes}:${seconds}.${milliseconds}`;
  }

  /**
   * 生成单个通话的Mermaid序列图
   * @param logs 通话日志数组
   * @returns Mermaid序列图字符串
   */
  generateMermaidForCall(logs: ParsedLogInfo[]): string {
    const sortedLogs = [...logs].sort((a, b) => {
      const t1 = a.msgTimestamp || a.ts;
      const t2 = b.msgTimestamp || b.ts;
      return t1 - t2;
    });
    if (sortedLogs.length === 0) return 'sequenceDiagram\n    Note over NoData: 无日志数据';

    let mermaid = 'sequenceDiagram\n';

    // 提取所有参与者
    const participants = new Set<string>();
    sortedLogs.forEach(log => {
      participants.add(log.from);
      participants.add(log.to);
    });

    // 添加参与者声明
    participants.forEach(participant => {
      mermaid += `  participant ${participant}\n`;
    });

    // 添加信令交互
    sortedLogs.forEach(log => {
      const time = this.formatTimestamp(log.msgTimestamp || log.ts);
      const timeDesc = log.msgTimestamp ? 'messageTime' : '信令内time';
      mermaid += `  ${log.from}->>${log.to}: ${log.action} (${timeDesc}: ${time})\n`;
    });

    return mermaid;
  }

  /**
   * 生成所有通话的Mermaid序列图
   * @returns Mermaid序列图字符串
   */
  generateMermaid(): string {
    const allCalls = Array.from(this.parser.getCallIdToLogsMap().entries());
    let mermaid = '';

    allCalls.forEach(([callId, logs]) => {
      mermaid += `\n%% 通话ID: ${callId}\n`;
      mermaid += this.generateMermaidForCall(logs);
      mermaid += '\n';
    });

    return mermaid;
  }

  /**
   * 将可视化结果写入文件
   * @param format 报告格式 (html/mermaid)
   * @param outputPath 输出文件路径
   * @returns Promise<void>
   */
  async writeToFile(format: string, outputPath?: string): Promise<string> {
    let content: string;
    let defaultExtension: string;

    if (format === 'html') {
      content = this.generateHtml();
      defaultExtension = 'html';
    } else if (format === 'mermaid') {
      content = this.generateMermaid();
      defaultExtension = 'mmd';
    } else {
      throw new Error(`不支持的格式: ${format}`);
    }

    // 如果没有指定输出路径，使用默认路径
    const outputFilePath = outputPath || path.join(process.cwd(), `callkit_signals.${defaultExtension}`);

    await writeFile(outputFilePath, content, 'utf8');
    return outputFilePath;
  }

  /**
   * 生成并保存HTML报告
   * @param outputPath 输出文件路径
   * @returns Promise<string> 输出文件路径
   */
  async generateHtmlReport(outputPath?: string): Promise<string> {
    return this.writeToFile('html', outputPath);
  }

  /**
   * 生成并保存Mermaid报告
   * @param outputPath 输出文件路径
   * @returns Promise<string> 输出文件路径
   */
  async generateMermaidReport(outputPath?: string): Promise<string> {
    return this.writeToFile('mermaid', outputPath);
  }
}