import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);

/**
 * 信令解析器类
 * 用于解析日志文件，提取包含'rtcCallWithAgora'的日志行，并按callid分组存储
 */
export class SignalParser {
  private rtcCallLogs: string[];
  private callIdToLogsMap: Map<string, string[]>;

  constructor() {
    this.rtcCallLogs = [];
    this.callIdToLogsMap = new Map();
  }

  /**
   * 获取存储的rtcCallWithAgora日志
   * @returns rtcCallWithAgora日志数组
   */
  getRtcCallLogs(): string[] {
    return this.rtcCallLogs;
  }

  /**
   * 从日志行中提取callId
   * @param logLine 日志行
   * @returns callId或null
   */
  private extractCallId(logLine: string): string | null {
    const callIdRegex = /key\s*:\s*callId\s*,\s*type\s*:\s*\d+\s*,\s*value\s*:\s*([\w-]+)/;
    const match = logLine.match(callIdRegex);
    return match ? match[1] : null;
  }

  /**
   * 获取按callId分组的日志
   * @returns Map<string, string[]> 键为callId，值为该callId对应的所有日志行
   */
  getCallIdToLogsMap(): Map<string, string[]> {
    return this.callIdToLogsMap;
  }

  /**
   * 清空存储的rtcCallWithAgora日志和callId映射
   */
  clearRtcCallLogs(): void {
    this.rtcCallLogs = [];
    this.callIdToLogsMap.clear();
  }

  /**
   * 从单个日志文件中提取rtcCallWithAgora日志
   * @param logFilePath 日志文件路径
   * @returns 提取到的rtcCallWithAgora日志数量
   */
  async parseLogFile(logFilePath: string): Promise<number> {
    try {
      const content = await readFile(logFilePath, 'utf8');
      const lines = content.split('\n');
      let count = 0;

      for (const line of lines) {
        if (line.includes('rtcCallWithAgora')) {
          this.rtcCallLogs.push(line);
          count++;
          
          // 提取callId并按callId分组存储
          const callId = this.extractCallId(line);
          if (callId) {
            if (!this.callIdToLogsMap.has(callId)) {
              this.callIdToLogsMap.set(callId, []);
            }
            this.callIdToLogsMap.get(callId)?.push(line);
          }
        }
      }

      console.log(`从文件 ${path.basename(logFilePath)} 中提取了 ${count} 条rtcCallWithAgora日志`);
      return count;
    } catch (error) {
      console.error(`解析文件 ${logFilePath} 失败:`, error);
      throw error;
    }
  }

  /**
   * 从目录中所有日志文件提取rtcCallWithAgora日志
   * @param logDir 日志目录路径
   * @returns 提取到的rtcCallWithAgora日志总数
   */
  async parseLogDirectory(logDir: string): Promise<number> {
    try {
      const files = await readdir(logDir);
      let totalCount = 0;

      for (const file of files) {
        const filePath = path.join(logDir, file);
        const stats = fs.statSync(filePath);

        // 排除rtcCallLogs.txt文件，避免重复解析
        if (stats.isFile() && file !== 'rtcCallLogs.txt' && 
            (path.extname(file).toLowerCase() === '.txt' || path.extname(file).toLowerCase() === '.log')) {
          const count = await this.parseLogFile(filePath);
          totalCount += count;
        }
      }

      console.log(`从目录 ${logDir} 中总共提取了 ${totalCount} 条rtcCallWithAgora日志`);
      return totalCount;
    } catch (error) {
      console.error(`解析目录 ${logDir} 失败:`, error);
      throw error;
    }
  }


}

// 示例用法
if (import.meta.url === `file://${process.argv[1]}`) {
  const parser = new SignalParser();
  const logInputDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../logInput');
  
  parser.parseLogDirectory(logInputDir)
    .then(() => {
      const totalLogs = parser.getRtcCallLogs().length;
      const callIdMap = parser.getCallIdToLogsMap();
      
      console.log(`总共提取到 ${totalLogs} 条rtcCallWithAgora日志`);
      console.log(`按callId分为 ${callIdMap.size} 个通话会话`);
      
      // 输出每个callId的日志数量
      console.log('\n各通话会话日志数量统计:');
      callIdMap.forEach((logs, callId) => {
        console.log(`callId: ${callId}, 日志数量: ${logs.length}`);
      });
    })
    .catch((error) => console.error('解析失败:', error));
}