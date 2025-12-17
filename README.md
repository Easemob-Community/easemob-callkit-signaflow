# easemob-callkit-signaflow
node编写的callkit信令跟踪可视化工具库
├── src/                          # TypeScript源码目录
│   ├── core/                     # 核心逻辑模块（关键功能区）
│   │   ├── Types.ts              # 信令数据类型定义（IDE自动显示字段含义）
│   │   ├── SignalParser.ts       # 日志解析器（输入log→输出信令事件）
│   │   └── Visualizer.ts         # 可视化生成器（信令事件→HTML/Mermaid）
│   ├── app.ts                    # Express服务（提供交互式Web界面）
│   └── index.ts                  # CLI命令入口（用户执行入口）
├── package.json                  # 项目配置（含npm脚本和依赖）
├── tsconfig.json                 # TypeScript配置（类型检查规则）
└── README.md                     # 项目说明（含使用示例）