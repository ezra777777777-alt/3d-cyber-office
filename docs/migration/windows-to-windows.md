# Windows 到 Windows 迁移

## 适用范围

适用于把 3D 赛博办公室从一台 Windows 电脑迁移到另一台 Windows 电脑。

## 旧电脑导出

1. 启动项目：

   ```powershell
   cd "C:\Users\A413\Documents\3D赛博办公室"
   npm.cmd run dev
   ```

2. 打开浏览器中的 Migration 页面。
3. 点击"预览 JSON"。
4. 点击"下载 JSON"。
5. 保存迁移包。

## 复制源码

复制项目源码目录，但不要复制：

- `node_modules/`
- `dist/`
- `.vite/`
- `*.log`
- `tsconfig.tsbuildinfo`

推荐新路径：

```text
D:\projects\3d-cyber-office
```

## 新电脑安装

1. 安装 Node.js LTS。
2. 打开 PowerShell：

   ```powershell
   cd "D:\projects\3d-cyber-office"
   npm install
   npm.cmd run dev
   ```

3. 打开 Vite 打印的 localhost 地址。
4. 进入 Migration 页面。
5. 粘贴迁移 JSON。
6. 点击"预览导入"。
7. 确认健康检查不是 blocked。
8. 点击"应用导入"。
9. 刷新页面。

## 验收

- Office 能看到 Agent 和任务状态。
- Calendar 进度恢复。
- Tasks 过滤和依赖展开恢复。
- Files 能看到 artifact。
- Commander mission、approval、artifact 恢复。
- Runtime/API 凭据没有出现在迁移包里。

## 凭据

真实 Runtime、API key、token、password 不会迁移。请在新电脑的外部 Runtime 中重新配置。
