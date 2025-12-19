import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { ParsedLogInfo, SignalParser } from './SignalParser.js';

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
    const allCalls: [string, ParsedLogInfo[]][] = Array.from(this.parser.getCallIdToLogsMap().entries());

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
    
    /* AI分析配置区域样式 */
    .ai-config-section {
      margin: 20px 0;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      border: 1px solid #e9ecef;
    }
    .ai-config-form {
      display: flex;
      align-items: center;
      gap: 15px;
      flex-wrap: wrap;
    }
    .ai-config-form label {
      font-weight: 500;
      color: #6c757d;
    }
    .ai-config-form input,
    .ai-config-form select {
      padding: 8px 12px;
      border: 1px solid #ced4da;
      border-radius: 4px;
      font-size: 14px;
    }
    .ai-config-form button {
      padding: 8px 16px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.3s;
    }
    .ai-config-form button:hover {
      background: #0056b3;
    }
    
    /* AI分析按钮样式 */
    .ai-analysis-button {
      padding: 8px 16px;
      background: #28a745;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      margin: 10px 0;
      transition: background-color 0.3s;
    }
    .ai-analysis-button:hover {
      background: #218838;
    }
    .ai-analysis-button:disabled {
      background: #6c757d;
      cursor: not-allowed;
    }
    
    /* AI分析结果样式 */
    .ai-analysis-result {
      margin: 15px 0;
      padding: 15px;
      background: #e7f3ff;
      border-left: 4px solid #007bff;
      border-radius: 4px;
      display: none;
    }
    .ai-analysis-result h5 {
      margin-top: 0;
      color: #007bff;
    }
    .ai-analysis-content {
      white-space: pre-wrap;
      line-height: 1.6;
    }
    
    /* 加载状态样式 */
    .loading-spinner {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 3px solid rgba(0,123,255,.3);
      border-radius: 50%;
      border-top-color: #007bff;
      animation: spin 1s ease-in-out infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <h1>环信CallKit信令可视化报告</h1>
  <h2>SDK版本: ${this.parser.getCoreVersion() || '未知'} | Git Commit: ${this.parser.getGitCommit() || '未知'}</h2>
  
  <!-- AI分析配置区域 -->
  <div class="ai-config-section">
    <h3>AI分析配置</h3>
    <div class="ai-config-form">
      <label for="ai-api-key">AI API Key:</label>
      <input type="password" id="ai-api-key" placeholder="输入AI模型API Key">
      <select id="ai-model-select">
        <option value="doubao-seed-1-8-251215">火山引擎-豆包</option>
        <option value="qwen-plus">通义千问</option>
        <option value="qwen-long">通义千问Long</option>
      </select>
      <button id="save-ai-config">保存配置</button>
      <p id="ai-config-status" style="color: green; display: none;">配置已保存</p>
    </div>
  </div>
  
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
      
      <!-- AI分析部分 -->
      <div class="ai-analysis-section">
        <button class="ai-analysis-button" data-callid="${callId}">
          <span class="btn-text">AI分析此通话</span>
          <span class="loading-spinner" style="display: none;"></span>
        </button>
        <div class="ai-analysis-result" id="ai-result-${callId}">
          <h5>AI分析结果</h5>
          <div class="ai-analysis-content"></div>
        </div>
      </div>
    </div>`;
  }).join('')}

  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  <script>
    // 等待DOM加载完成后初始化Mermaid和AI分析功能
    document.addEventListener('DOMContentLoaded', function() {
      console.log('DOM加载完成，开始初始化Mermaid和AI分析功能');
      try {
        mermaid.initialize({ theme: 'default' });
        mermaid.contentLoaded();
        console.log('Mermaid初始化完成');
        
        // 初始化AI分析功能
        initAiAnalysis();
      } catch (error) {
        console.error('初始化失败:', error);
      }
    });
    
    // 初始化AI分析功能
    function initAiAnalysis() {
      console.log('开始初始化AI分析功能');
      try {
        // 检查浏览器环境
        console.log('浏览器环境:', window.location.protocol);
        console.log('localStorage可用:', typeof localStorage !== 'undefined');
        
        // 加载保存的AI配置
        loadAiConfig();
        
        // 保存AI配置按钮事件
        const saveBtn = document.getElementById('save-ai-config');
        if (saveBtn) {
          console.log('找到保存配置按钮:', saveBtn);
          saveBtn.addEventListener('click', saveAiConfig);
          console.log('已为保存配置按钮添加点击事件');
        } else {
          console.error('未找到保存配置按钮');
          console.log('所有ID为save-ai-config的元素:', document.querySelectorAll('#save-ai-config'));
        }
        
        // 为所有AI分析按钮添加事件
        const aiButtons = document.querySelectorAll('.ai-analysis-button');
        console.log('找到AI分析按钮数量:', aiButtons.length);
        console.log('所有AI分析按钮:', aiButtons);
        
        if (aiButtons.length === 0) {
          console.error('未找到任何AI分析按钮');
          console.log('所有.ai-analysis-button元素:', document.querySelectorAll('.ai-analysis-button'));
          return;
        }
        
        aiButtons.forEach(button => {
          button.addEventListener('click', handleAiAnalysisClick);
          console.log('为按钮添加事件监听:', button.dataset.callid);
        });
        
        console.log('AI分析功能初始化完成');
      } catch (error) {
        console.error('初始化AI分析功能失败:', error);
        console.error('错误堆栈:', error.stack);
      }
    }
    
    // 加载AI配置
    function loadAiConfig() {
      const savedConfig = localStorage.getItem('aiAnalysisConfig');
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        document.getElementById('ai-api-key').value = config.apiKey || '';
        document.getElementById('ai-model-select').value = config.model || 'doubao-seed-1-8-251215';
      }
    }
    
    // 保存AI配置
    function saveAiConfig() {
      const apiKey = document.getElementById('ai-api-key').value;
      const model = document.getElementById('ai-model-select').value;
      
      const config = { apiKey, model };
      localStorage.setItem('aiAnalysisConfig', JSON.stringify(config));
      
      // 显示保存成功提示
      const statusElement = document.getElementById('ai-config-status');
      statusElement.style.display = 'inline';
      setTimeout(() => {
        statusElement.style.display = 'none';
      }, 2000);
    }
    
    // 处理AI分析按钮点击
    async function handleAiAnalysisClick(e) {
      console.log('AI分析按钮点击事件触发:', e);
      console.log('事件目标:', e.target);
      console.log('事件目标类名:', e.target.className);
      
      try {
        // 获取按钮元素，确保是点击了按钮本身
        const button = e.target.closest('.ai-analysis-button');
        if (!button) {
          console.error('未找到AI分析按钮元素');
          return;
        }
        
        console.log('找到AI分析按钮元素:', button);
        const callId = button.dataset.callid;
        console.log('开始分析通话ID:', callId);
        
        // 禁用按钮并显示加载状态
        button.disabled = true;
        const btnText = button.querySelector('.btn-text');
        const spinner = button.querySelector('.loading-spinner');
        if (btnText) {
          console.log('找到按钮文本元素:', btnText);
          btnText.textContent = '分析中...';
        } else {
          console.error('未找到按钮文本元素');
        }
        
        if (spinner) {
          console.log('找到加载动画元素:', spinner);
          spinner.style.display = 'inline-block';
        } else {
          console.error('未找到加载动画元素');
        }
        
        // 获取AI配置
        console.log('获取AI配置...');
        const savedConfig = localStorage.getItem('aiAnalysisConfig');
        if (!savedConfig) {
          console.error('未找到保存的AI配置');
          alert('请先配置AI API Key');
          return;
        }
        
        console.log('找到保存的AI配置:', savedConfig);
        const config = JSON.parse(savedConfig);
        if (!config.apiKey) {
          console.error('AI API Key为空');
          alert('请先输入AI API Key');
          return;
        }
        
        // 收集该通话的所有日志
        console.log('收集通话ID为' + callId + '的日志...');
        const callSection = document.getElementById(callId);
        if (!callSection) {
          throw new Error('未找到通话ID对应的元素: ' + callId);
        }
        
        const logItems = callSection.querySelectorAll('.log-item');
        console.log('找到日志条目数量:', logItems.length);
        const logs = Array.from(logItems).map(item => {
          const action = item.querySelector('.log-action')?.textContent || '';
          const rawLog = item.querySelector('.raw-log')?.textContent || '';
          return {
            action,
            rawLog
          };
        });
        
        console.log('收集到日志数量:', logs.length);
        
        // 调用AI分析
        console.log('准备调用AI API...');
        const analysisResult = await callAiApi(config, callId, logs);
        console.log('AI API调用成功，结果:', analysisResult);
        
        // 显示分析结果
        console.log('显示分析结果...');
        const resultElement = document.getElementById('ai-result-' + callId);
        if (resultElement) {
          console.log('找到结果显示元素:', resultElement);
          const contentDiv = resultElement.querySelector('.ai-analysis-content');
          if (contentDiv) {
            console.log('找到结果内容元素:', contentDiv);
            contentDiv.textContent = analysisResult;
          } else {
            console.error('未找到结果内容元素');
          }
          resultElement.style.display = 'block';
        } else {
          console.error('未找到结果显示元素: ai-result-' + callId);
        }
        
      } catch (error) {
        console.error('AI分析失败:', error);
        console.error('错误堆栈:', error.stack);
        alert('AI分析失败: ' + (error.message || '未知错误'));
      } finally {
        // 恢复按钮状态
        console.log('恢复按钮状态...');
        const button = e.target.closest('.ai-analysis-button');
        if (button) {
          console.log('找到按钮元素以恢复状态:', button);
          button.disabled = false;
          const btnText = button.querySelector('.btn-text');
          const spinner = button.querySelector('.loading-spinner');
          if (btnText) btnText.textContent = 'AI分析此通话';
          if (spinner) spinner.style.display = 'none';
        }
      }
    }
    
    // 调用AI API
    async function callAiApi(config, callId, logs) {
      console.log('调用AI API，模型:', config.model);
      console.log('AI API Key:', config.apiKey ? '已设置（长度: ' + config.apiKey.length + '）' : '未设置');
      
      let apiUrl;
      let requestBody;
      let result;
      
      // 根据不同模型设置API URL和请求格式
      if (config.model === 'qwen-plus' || config.model === 'qwen-long') {
        // 通义千问API
        apiUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
        requestBody = {
          model: config.model,
          messages: [
            {
              role: 'system',
              content: '你是一个专业的音视频通话信令分析专家，请详细分析以下通话ID的信令日志，但回复需简洁，直指问题要害，重点说明通话流程是否正常、存在的核心问题及优化建议。'
            },
            {
              role: 'user',
              content: '通话ID: ' + callId + '\\n\\n信令日志:\\n' + JSON.stringify(logs, null, 2)
            }
          ]
        };
      } else {
        // 火山引擎API格式
        apiUrl = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
        requestBody = {
          model: config.model,
          messages: [
            {
              content: [
                {
                  text: '你是一个专业的音视频通话信令分析专家，请分析以下通话ID的信令日志，提供详细的分析报告，包括通话流程是否正常、可能存在的问题、优化建议等。\\n\\n通话ID: ' + callId + '\\n\\n信令日志:\\n' + JSON.stringify(logs, null, 2),
                  type: 'text'
                }
              ],
              role: 'user'
            }
          ]
        };
      }
      
      console.log('API URL:', apiUrl);
      console.log('请求参数:', JSON.stringify(requestBody, null, 2));
      
      // 发送请求
      console.log('正在发送API请求...');
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + config.apiKey
          },
          body: JSON.stringify(requestBody)
        });
        
        console.log('API响应状态:', response.status);
        console.log('API响应状态文本:', response.statusText);
        
        // 读取响应内容
        const responseText = await response.text();
        console.log('API响应文本:', responseText);
        
        if (!response.ok) {
          try {
            const errorData = JSON.parse(responseText);
            throw new Error(errorData.error?.message || 'HTTP错误: ' + response.status);
          } catch (e) {
            throw new Error('HTTP错误: ' + response.status + '，响应内容: ' + responseText);
          }
        }
        
        // 解析响应数据
        const data = JSON.parse(responseText);
        console.log('解析后的API响应数据:', JSON.stringify(data, null, 2));
        
        // 验证响应格式
        if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
          throw new Error('API响应格式错误：未找到有效结果');
        }
        
        if (!data.choices[0].message || !data.choices[0].message.content) {
          throw new Error('API响应格式错误：未找到消息内容');
        }
        
        // 根据不同模型解析响应格式
        if (config.model === 'qwen-plus' || config.model === 'qwen-long') {
          // 通义千问响应格式
          result = data.choices[0].message.content;
        } else {
          // 火山引擎响应格式
          if (!Array.isArray(data.choices[0].message.content) || data.choices[0].message.content.length === 0) {
            throw new Error('API响应格式错误：内容格式不正确');
          }
          
          if (!data.choices[0].message.content[0].text) {
            throw new Error('API响应格式错误：未找到文本内容');
          }
          
          result = data.choices[0].message.content[0].text;
        }
        
        console.log('提取的分析结果:', result);
        return result;
      } catch (error) {
        console.error('API请求失败:', error);
        console.error('错误堆栈:', error.stack);
        throw error;
      }
    }
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