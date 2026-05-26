# Windows 到 Windows 迁移

## 适用范围

适用于把当前项目从一台 Windows 电脑迁移到另一台 Windows 电脑。

## 旧电脑：导出浏览器状态

```powershell
cd "<旧电脑项目目录>"
npm.cmd run dev
```

打开应用后：

1. 进入 `Migration` 页面。
2. 点击预览导出。
3. 下载迁移 JSON。
4. 单独保存这个 JSON 文件。

## 复制源码

复制项目源码目录，但不要复制：

- `node_modules/`
- `dist/`
- `.vite/`
- `.env`
- `.env.*`
- `.local-runtime/`
- `*.log`
- `tsconfig.tsbuildinfo`

推荐新路径：

```text
D:\projects\3d-cyber-office
```

## 新电脑：安装和启动

1. 安装 Node.js LTS。
2. 打开 PowerShell：

```powershell
cd "D:\projects\3d-cyber-office"
npm install
npm.cmd run doctor
npm.cmd run dev:all
```

3. 打开 Vite 打印的浏览器地址。
4. 进入 `Migration` 页面。
5. 粘贴迁移 JSON。
6. 预览导入。
7. 确认健康检查不是 blocked。
8. 应用导入。
9. 刷新页面。

## Runtime 凭据

真实 Runtime、API key、token、password 不会迁移。请在新电脑上重新配置 `.env` 或外部安全 Runtime。

## 验收

- `npm.cmd run doctor` 没有 fail。
- Office 能打开。
- Commander 状态恢复。
- Calendar/Tasks/Files/Review 状态恢复。
- Gateway 可以连接本地 Runtime。
- 迁移 JSON 中没有 API key、token、password。
