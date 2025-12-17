import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);
const writeFile = promisify(fs.writeFile);

/**
 * 提取后的日志关键信息接口
 */
export interface ParsedLogInfo {
  callId: string;
  from: string;
  to: string;
  action: string;
  ts: number;
  rawLog?: string; // 保留原始日志，方便调试
}


/**
 * 信令解析器类
 * 用于解析日志文件，提取包含'rtcCallWithAgora'的日志行，并按callid分组存储
 */
export class SignalParser {
  private rtcCallLogs: ParsedLogInfo[];
  private callIdToLogsMap: Map<string, ParsedLogInfo[]>;
  private oneToOneCallMap: Map<string, ParsedLogInfo[]>;
  private groupCallMap: Map<string, ParsedLogInfo[]>;
  private unknownCallMap: Map<string, ParsedLogInfo[]>;
  private callTypeMap: Map<string, 'oneToOne' | 'group' | 'unknown'>;

  constructor() {
    this.rtcCallLogs = [];
    this.callIdToLogsMap = new Map();
    this.oneToOneCallMap = new Map();
    this.groupCallMap = new Map();
    this.unknownCallMap = new Map();
    this.callTypeMap = new Map();
  }

  /**
   * 获取存储的rtcCallWithAgora日志
   * @returns rtcCallWithAgora日志数组
   */
  getRtcCallLogs(): ParsedLogInfo[] {
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
   * 从日志行中提取from用户
   * @param logLine 日志行
   * @returns from用户或null
   */
  private extractFrom(logLine: string): string | null {
    const fromRegex = /chattype\s*:\s*\w+\s*,\s*from\s*:\s*([\w-]+)/;
    const match = logLine.match(fromRegex);
    return match ? match[1] : null;
  }

  /**
   * 从日志行中提取to用户
   * @param logLine 日志行
   * @returns to用户或null
   */
  private extractTo(logLine: string): string | null {
    const toRegex = /from\s*:\s*[\w-]+\s*,\s*to\s*:\s*([\w-]+)/;
    const match = logLine.match(toRegex);
    return match ? match[1] : null;
  }

  /**
   * 从日志行中提取action
   * @param logLine 日志行
   * @returns action或null
   */
  private extractAction(logLine: string): string | null {
    const actionRegex = /key\s*:\s*action\s*,\s*type\s*:\s*\d+\s*,\s*value\s*:\s*([\w-]+)/;
    const match = logLine.match(actionRegex);
    return match ? match[1] : null;
  }

  /**
   * 从日志行中提取timestamp
   * @param logLine 日志行
   * @returns timestamp或null
   */
  private extractTs(logLine: string): number | null {
    const tsRegex = /key\s*:\s*ts\s*,\s*type\s*:\s*\d+\s*,\s*value\s*:\s*(\d+)/;
    const match = logLine.match(tsRegex);
    return match ? parseInt(match[1], 10) : null;
  }

  /**
   * 从日志行中提取所有关键信息
   * @param logLine 日志行
   * @returns 提取后的日志关键信息或null
   */
  private extractLogInfo(logLine: string): ParsedLogInfo | null {
    const callId = this.extractCallId(logLine);
    const from = this.extractFrom(logLine);
    const to = this.extractTo(logLine);
    const action = this.extractAction(logLine);
    const ts = this.extractTs(logLine);

    if (callId && from && to && action && ts !== null) {
      return {
        callId,
        from,
        to,
        action,
        ts,
        rawLog: logLine
      };
    }

    return null;
  }

  /**
   * 获取按callId分组的日志
   * @returns Map<string, ParsedLogInfo[]> 键为callId，值为该callId对应的所有日志行
   */
  getCallIdToLogsMap(): Map<string, ParsedLogInfo[]> {
    return this.callIdToLogsMap;
  }

  /**
   * 清空存储的rtcCallWithAgora日志和callId映射
   */
  clearRtcCallLogs(): void {
    this.rtcCallLogs = [];
    this.callIdToLogsMap.clear();
    this.oneToOneCallMap.clear();
    this.groupCallMap.clear();
    this.unknownCallMap.clear();
    this.callTypeMap.clear();
  }

  /**
   * 从日志行中提取call类型（一对一或群组）
   * @param logLine 日志行
   * @returns 通话类型 ('oneToOne' | 'group' | 'unknown') 或 null
   */
  private extractCallType(logLine: string): 'oneToOne' | 'group' | 'unknown' | null {
    // 检查是否是invite消息且包含TEXT类型的文本
    if (logLine.includes('{ key : action, type : 7, value : invite }') && 
        logLine.includes('contenttype : TEXT')) {
      // 提取type值，不关心type字段本身的值
      const typeRegex = /{ key : type, type : \d+, value : (\d+) }/;
      const match = logLine.match(typeRegex);
      if (match) {
        const typeValue = parseInt(match[1], 10);
        // type <= 1 是一对一，> 1 是群组
        return typeValue <= 1 ? 'oneToOne' : 'group';
      }
    }
    return null;
  }

  /**
   * 对callId进行分类
   * @param callId 通话ID
   * @param logs 该callId对应的所有解析后的日志信息
   */
  private classifyCall(callId: string, logs: ParsedLogInfo[]): void {
    // 查找该callId的invite消息
    for (const logInfo of logs) {
      const callType = this.extractCallType(logInfo.rawLog || '');
      if (callType) {
        this.callTypeMap.set(callId, callType);
        return;
      }
    }
    // 如果没有找到invite消息，标记为未知类型
    this.callTypeMap.set(callId, 'unknown');
  }

  /**
   * 获取一对一通话信令
   * @returns Map<string, ParsedLogInfo[]> 键为callId，值为该callId对应的所有日志行
   */
  getOneToOneCalls(): Map<string, ParsedLogInfo[]> {
    return this.oneToOneCallMap;
  }

  /**
   * 获取群组通话信令
   * @returns Map<string, ParsedLogInfo[]> 键为callId，值为该callId对应的所有日志行
   */
  getGroupCalls(): Map<string, ParsedLogInfo[]> {
    return this.groupCallMap;
  }

  /**
   * 获取未知类型通话信令
   * @returns Map<string, ParsedLogInfo[]> 键为callId，值为该callId对应的所有日志行
   */
  getUnknownCalls(): Map<string, ParsedLogInfo[]> {
    return this.unknownCallMap;
  }

  /**
   * 根据callId获取通话类型
   * @param callId 通话ID
   * @returns 通话类型 ('oneToOne' | 'group' | 'unknown') 或 undefined
   */
  getCallType(callId: string): 'oneToOne' | 'group' | 'unknown' | undefined {
    return this.callTypeMap.get(callId);
  }

  /**
   * 获取通话类型统计信息
   * @returns 包含各类型通话数量的对象
   */
  getCallTypeStatistics(): {
    total: number;
    oneToOne: number;
    group: number;
    unknown: number;
  } {
    return {
      total: this.callIdToLogsMap.size,
      oneToOne: this.oneToOneCallMap.size,
      group: this.groupCallMap.size,
      unknown: this.unknownCallMap.size
    };
  }

  /**
   * 将解析后的数据输出到临时JSON文件
   * @param outputFilePath 输出文件路径
   * @returns Promise<void>
   */
  async exportToJson(outputFilePath: string = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../parsed_logs.json')): Promise<void> {
    try {
      // 准备导出数据
      const exportData = {
        statistics: this.getCallTypeStatistics(),
        allCalls: Array.from(this.callIdToLogsMap.entries()).map(([callId, logs]) => ({
          callId,
          type: this.callTypeMap.get(callId) || 'unknown',
          logsCount: logs.length,
          logs: logs.map(log => ({
            callId: log.callId,
            from: log.from,
            to: log.to,
            action: log.action,
            ts: log.ts
          }))
        }))
      };

      // 写入文件
      await writeFile(outputFilePath, JSON.stringify(exportData, null, 2), 'utf8');
      console.log(`解析后的数据已输出到文件: ${outputFilePath}`);
    } catch (error) {
      console.error(`输出文件失败:`, error);
      throw error;
    }
  }

  /**
   * 重新分类所有日志
   */
  private reclassifyAllCalls(): void {
    // 清空所有分类映射
    this.oneToOneCallMap.clear();
    this.groupCallMap.clear();
    this.unknownCallMap.clear();

    // 对每个callId进行分类
    this.callIdToLogsMap.forEach((logs, callId) => {
      // 确保callId已分类
      if (!this.callTypeMap.has(callId)) {
        this.classifyCall(callId, logs);
      }

      // 获取分类结果
      const callType = this.callTypeMap.get(callId) || 'unknown';
      const targetMap = callType === 'oneToOne' ? this.oneToOneCallMap :
                       callType === 'group' ? this.groupCallMap :
                       this.unknownCallMap;

      // 将日志添加到对应的映射中
      targetMap.set(callId, logs);
    });
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
        // 增加匹配条件：必须包含rtcCallWithAgora，并且是COMMAND类型的rtcCall信令或TEXT类型的邀请信令
        if (line.includes('rtcCallWithAgora') && 
            (line.includes('contents : [ { contenttype : COMMAND, action : rtcCall } ]') || 
             (line.includes('contenttype : TEXT') && line.includes('key : action, type : 7, value : invite')))) {
          
          // 提取关键信息
          const logInfo = this.extractLogInfo(line);
          if (logInfo) {
            this.rtcCallLogs.push(logInfo);
            count++;
            
            // 按callId分组存储
            const callId = logInfo.callId;
            if (!this.callIdToLogsMap.has(callId)) {
              this.callIdToLogsMap.set(callId, []);
            }
            this.callIdToLogsMap.get(callId)?.push(logInfo);
          } else {
            console.warn(`无法提取日志行的关键信息: ${line.substring(0, 100)}...`);
          }
        }
      }

      // 重新分类所有日志
      this.reclassifyAllCalls();
      
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

      // 重新分类所有日志
      this.reclassifyAllCalls();
      
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
    .then(async () => {
      const totalLogs = parser.getRtcCallLogs().length;
      const callIdMap = parser.getCallIdToLogsMap();
      const stats = parser.getCallTypeStatistics();
      
      console.log(`总共提取到 ${totalLogs} 条rtcCallWithAgora日志`);
      console.log(`按callId分为 ${callIdMap.size} 个通话会话`);
      
      // 输出通话类型统计
      console.log('\n通话类型统计:');
      console.log(`一对一通话: ${stats.oneToOne} 个`);
      console.log(`群组通话: ${stats.group} 个`);
      console.log(`未知类型: ${stats.unknown} 个`);
      
      // 输出每个callId的日志数量和类型
      console.log('\n各通话会话详细信息:');
      callIdMap.forEach((logs, callId) => {
        const callType = parser.getCallType(callId) || 'unknown';
        console.log(`callId: ${callId}, 类型: ${callType}, 日志数量: ${logs.length}`);
        
        // 输出前几条日志的关键信息
        console.log(`  前${Math.min(3, logs.length)}条日志:`);
        logs.slice(0, 3).forEach((log, index) => {
          console.log(`    ${index + 1}. action: ${log.action}, from: ${log.from}, to: ${log.to}, ts: ${log.ts}`);
        });
      });
      
      // 导出到临时JSON文件
      await parser.exportToJson();
      
      // 输出为Mermaid序列图格式的示例
      console.log('\nMermaid序列图示例:');
      console.log('```mermaid');
      console.log('sequenceDiagram');
      
      // 为每个callId生成简单的序列图
      callIdMap.forEach((logs, callId) => {
        const sortedLogs = [...logs].sort((a, b) => a.ts - b.ts);
        
        console.log(`  participant ${sortedLogs[0].from}`);
        console.log(`  participant ${sortedLogs[0].to}`);
        
        sortedLogs.forEach(log => {
          console.log(`  ${log.from}->>${log.to}: ${log.action} (${new Date(log.ts).toLocaleTimeString()})`);
        });
      });
      
      console.log('```');
    })
    .catch((error) => console.error('解析失败:', error));
}