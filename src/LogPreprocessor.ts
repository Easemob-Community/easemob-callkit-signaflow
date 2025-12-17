import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const gunzip = promisify(zlib.gunzip);
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);

/**
 * 日志预处理器类
 * 用于扫描目录下所有.gz文件，解析为.txt并按时间范围命名后放入input文件夹
 */
export class LogPreprocessor {
  private inputDir: string;

  constructor(inputDir?: string) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    this.inputDir = inputDir || path.join(__dirname, '../logInput');
    // 确保input目录存在
    if (!fs.existsSync(this.inputDir)) {
      fs.mkdirSync(this.inputDir, { recursive: true });
    }
  }

  /**
   * 扫描目录下所有.gz文件和.log文件
   * @param dir 要扫描的目录路径
   * @returns .gz文件和.log文件路径数组
   */
  async scanLogFiles(dir: string): Promise<string[]> {
    try {
      const files = await readdir(dir);
      const logFiles: string[] = [];

      for (const file of files) {
        const filePath = path.join(dir, file);
        const fileStats = await stat(filePath);
        const fileExt = path.extname(file).toLowerCase();

        if (fileStats.isFile() && (fileExt === '.gz' || fileExt === '.log')) {
          logFiles.push(filePath);
        } else if (fileStats.isDirectory()) {
          // 递归扫描子目录
          const subDirLogFiles = await this.scanLogFiles(filePath);
          logFiles.push(...subDirLogFiles);
        }
      }

      return logFiles;
    } catch (error) {
      console.error('扫描日志文件失败:', error);
      throw error;
    }
  }

  /**
   * 解压.gz文件为.txt
   * @param gzFilePath .gz文件路径
   * @param txtFilePath 解压后的.txt文件路径
   */
  async extractGzFile(gzFilePath: string, txtFilePath: string): Promise<void> {
    try {
      const buffer = await readFile(gzFilePath);
      const decompressedBuffer = await gunzip(buffer);
      await writeFile(txtFilePath, decompressedBuffer);
      console.log(`解压完成: ${gzFilePath} -> ${txtFilePath}`);
    } catch (error) {
      console.error(`解压文件失败 ${gzFilePath}:`, error);
      throw error;
    }
  }

  /**
   * 解析.txt日志文件获取起始和结束时间
   * @param txtFilePath .txt文件路径
   * @returns 包含startTime和endTime的对象
   */
  async getLogTimeRange(txtFilePath: string): Promise<{ startTime: string; endTime: string }> {
    try {
      const content = await readFile(txtFilePath, 'utf8');
      const lines = content.split('\n');
      
      // 正则表达式匹配日志时间格式（日志时间格式如：[2025/12/17 14:46:42:106(08)]）
      const timeRegex = /^\[(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}):\d{3}\(\d{2}\)\]/;
      let startTime: string | null = null;
      let endTime: string | null = null;

      // 从前往后找第一个匹配的时间（起始时间）
      for (const line of lines) {
        const match = line.match(timeRegex);
        if (match) {
          startTime = match[1];
          break;
        }
      }

      // 从后往前找第一个匹配的时间（结束时间）
      for (let i = lines.length - 1; i >= 0; i--) {
        const match = lines[i].match(timeRegex);
        if (match) {
          endTime = match[1];
          break;
        }
      }

      if (!startTime || !endTime) {
        throw new Error(`无法从文件 ${txtFilePath} 中提取时间范围`);
      }

      // 将时间格式转换为便于文件名的格式（如：20231217103045）
      const formatTime = (timeStr: string): string => {
        return timeStr.replace(/[/ :]/g, '');
      };

      return {
        startTime: formatTime(startTime),
        endTime: formatTime(endTime)
      };
    } catch (error) {
      console.error(`解析日志时间失败 ${txtFilePath}:`, error);
      throw error;
    }
  }

  /**
   * 处理单个日志文件（支持.gz和.log格式）
   * @param logFilePath 日志文件路径
   */
  async processSingleFile(logFilePath: string): Promise<void> {
    try {
      const fileExt = path.extname(logFilePath).toLowerCase();
      let txtFilePath: string;
      
      if (fileExt === '.gz') {
        // 处理.gz文件
        // 创建临时.txt文件路径
        const tempTxtPath = path.join(path.dirname(logFilePath), `${path.basename(logFilePath, '.gz')}.txt`);
        
        // 解压文件
        await this.extractGzFile(logFilePath, tempTxtPath);
        txtFilePath = tempTxtPath;
      } else if (fileExt === '.log') {
        // 直接使用.log文件
        txtFilePath = logFilePath;
      } else {
        throw new Error(`不支持的文件格式: ${fileExt}`);
      }
      
      // 获取时间范围
      const { startTime, endTime } = await this.getLogTimeRange(txtFilePath);
      
      // 生成新文件名和路径
      const newFileName = `log_${startTime}_${endTime}.txt`;
      const newFilePath = path.join(this.inputDir, newFileName);
      
      // 复制文件到input目录
      await writeFile(newFilePath, await readFile(txtFilePath));
      
      // 如果是.gz解压后的临时文件，删除临时文件
      if (fileExt === '.gz') {
        fs.unlinkSync(txtFilePath);
      }
      
      console.log(`文件处理完成: ${logFilePath} -> ${newFilePath}`);
    } catch (error) {
      console.error(`处理文件失败 ${logFilePath}:`, error);
      throw error;
    }
  }

  /**
   * 批量处理目录下所有日志文件（支持.gz和.log格式）
   * @param dir 要处理的目录路径
   */
  async processDirectory(dir: string): Promise<void> {
    try {
      console.log(`开始扫描目录: ${dir}`);
      const logFiles = await this.scanLogFiles(dir);
      
      if (logFiles.length === 0) {
        console.log('未找到.gz或.log文件');
        return;
      }
      
      console.log(`找到 ${logFiles.length} 个日志文件`);
      
      // 逐个处理文件
      for (const logFile of logFiles) {
        await this.processSingleFile(logFile);
      }
      
      console.log('所有文件处理完成');
    } catch (error) {
      console.error('批量处理失败:', error);
      throw error;
    }
  }
}

// 示例用法
if (import.meta.url === `file://${process.argv[1]}`) {
  const preprocessor = new LogPreprocessor();
  const targetPath = process.argv[2] || process.cwd();
  
  // 检查目标路径是文件还是目录
  stat(targetPath)
    .then((stats) => {
      const fileExt = path.extname(targetPath).toLowerCase();
      if (stats.isFile() && (fileExt === '.gz' || fileExt === '.log')) {
        // 处理单个日志文件（支持.gz和.log格式）
        return preprocessor.processSingleFile(targetPath);
      } else {
        // 处理目录
        return preprocessor.processDirectory(targetPath);
      }
    })
    .then(() => console.log('处理完成'))
    .catch((error) => console.error('处理失败:', error));
}