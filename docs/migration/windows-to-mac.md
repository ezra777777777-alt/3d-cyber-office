# Windows 到 macOS 迁移

## 适用范围

适用于把 Windows 上的源码项目迁移到 macOS。

## 不要复制的内容

不要复制 Windows 上的 `node_modules/`。macOS 需要重新安装依赖。

## 推荐路径

```bash
mkdir -p ~/Projects
cd ~/Projects
```

项目目录建议使用英文：

```text
~/Projects/3d-cyber-office
```

## 安装步骤

1. 安装 Node.js LTS。
2. 复制源码到 `~/Projects/3d-cyber-office`。
3. 打开 Terminal：

   ```bash
   cd ~/Projects/3d-cyber-office
   npm install
   npm run dev
   ```

4. 打开 Vite 打印的 localhost 地址。
5. 进入 Migration 页面导入 JSON。
6. 刷新页面。

## PowerShell 命令对照

| Windows | macOS |
| --- | --- |
| `npm.cmd run dev` | `npm run dev` |
| `cd "D:\projects\3d-cyber-office"` | `cd ~/Projects/3d-cyber-office` |
| `Invoke-WebRequest` | `curl -I` |

## 验收

- `npm run test` 通过。
- `npm run build` 成功。
- Migration 健康检查不是 blocked。
- Commander mission 和 Dashboard 状态恢复。
- 真实 Runtime 凭据在 macOS 上重新配置，不从迁移包读取。
