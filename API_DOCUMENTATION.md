# 环信CallKit信令可视化工具 API文档

## 1. 概述

本文档详细描述了环信CallKit信令可视化工具提供的API接口，重点介绍接收.gz和.log文件并生成可视化HTML报告的功能。

## 2. 接口列表

### 2.1 信令可视化接口

**接口地址**: `POST /api/visualize`

**功能描述**: 上传信令日志文件(.log、.txt、.gz格式)，生成可视化HTML报告。

**请求参数**:

| 参数名 | 类型 | 位置 | 必选 | 描述 |
|--------|------|------|------|------|
| logFile | 文件 | form-data | 是 | 信令日志文件，支持格式：.log、.txt、.gz |
| format | string | form-data | 否 | 报告格式，可选值：html(默认)、mermaid |

**请求示例** (Postman配置):
- 请求方法: POST
- 请求URL: http://localhost:3000/api/visualize
- Body: form-data
  - Key: logFile, Value: 选择要上传的.gz或.log文件
  - Key: format, Value: html

**响应示例**:

- 成功响应:
  ```
  HTTP/1.1 200 OK
  Content-Type: text/html
  Content-Disposition: attachment; filename="callkit-signal-visualization.html"
  
  <!DOCTYPE html>
  <html lang="zh-CN">
  <!-- 完整的HTML报告内容 -->
  </html>
  ```

- 失败响应:
  ```json
  HTTP/1.1 400 Bad Request
  {
    "error": "不支持的文件格式，请上传.log、.txt或.gz文件"
  }
  ```

**文件支持说明**:
- .log: 普通文本日志文件，直接读取内容
- .txt: 文本文件，直接读取内容
- .gz: GZIP压缩文件，自动解压缩后读取内容
- 文件大小限制: 50MB

### 2.2 Mermaid转HTML接口

**接口地址**: `POST /api/mermaid-to-html`

**功能描述**: 将Mermaid格式的序列图转换为HTML报告。

**请求参数**:

| 参数名 | 类型 | 位置 | 必选 | 描述 |
|--------|------|------|------|------|
| mermaidContent | string | body | 是 | Mermaid格式的序列图代码 |
| outputFileName | string | body | 否 | 输出的HTML文件名 |

**请求示例**:
```json
{
  "mermaidContent": "sequenceDiagram\n    participant A as Client\n    participant B as Server\n    A->>B: 请求",
  "outputFileName": "custom-report.html"
}
```

**响应示例**:
- 成功响应: 返回HTML文件
- 失败响应: JSON格式错误信息

### 2.3 健康检查接口

**接口地址**: `GET /health`

**功能描述**: 检查服务是否正常运行。

**响应示例**:
```json
{
  "status": "ok",
  "timestamp": "2025-12-18T10:00:00Z"
}
```

## 3. 错误码说明

| 状态码 | 错误信息 | 说明 |
|--------|----------|------|
| 400 | 请上传日志文件 | 未提供logFile参数 |
| 400 | 不支持的文件格式，请上传.log、.txt或.gz文件 | 文件格式不支持 |
| 500 | 生成可视化报告失败 | 服务器内部错误 |
| 500 | 生成HTML报告失败 | 服务器内部错误 |

## 4. 测试指南

### 4.1 使用Postman测试

1. **启动服务**:
   ```bash
   npm run build
   node dist/app.js
   ```

2. **测试可视化接口**:
   - 创建新的POST请求
   - URL: http://localhost:3000/api/visualize
   - Body选择form-data
   - 添加Key: logFile，类型选择File，选择要上传的.gz或.log文件
   - 可选：添加Key: format，Value: html
   - 点击Send按钮
   - 响应应为HTML文件附件

3. **测试健康检查接口**:
   - 创建新的GET请求
   - URL: http://localhost:3000/health
   - 点击Send按钮
   - 响应应为JSON格式，status: ok

### 4.2 使用curl测试

```bash
# 测试可视化接口（上传.log文件）
curl -X POST -F "logFile=@/path/to/your/file.log" http://localhost:3000/api/visualize -o report.html

# 测试可视化接口（上传.gz文件）
curl -X POST -F "logFile=@/path/to/your/file.gz" http://localhost:3000/api/visualize -o report.html

# 测试健康检查接口
curl http://localhost:3000/health
```

## 5. 技术说明

### 5.1 文件处理流程

1. 接收文件上传请求
2. 根据文件扩展名判断文件类型
3. 对于.gz文件，使用zlib库解压缩
4. 对于.log/.txt文件，直接读取内容
5. 使用SignalParser解析日志内容
6. 使用Visualizer生成HTML报告
7. 返回HTML报告作为附件

### 5.2 安全措施

- 文件大小限制：50MB
- 支持的文件类型限制：.log、.txt、.gz
- 临时文件自动删除
- 错误处理完善

## 6. 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| 1.0 | 2025-12-18 | 初始版本，支持.gz和.log文件处理 |