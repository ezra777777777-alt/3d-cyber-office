# Windows 到 macOS 迁移

## 适用范围

适用于把 Windows 上的项目源码和浏览器状态迁移到 macOS。

## 不要复制的内容

不要复制这些内容：

- `node_modules/`
- `dist/`
- `.vite/`
- `.env`
- `.env.*`
- `.local-runtime/`
- Windows 专属临时文件

macOS 需要重新安装依赖。

## 推荐路径

```bash
mkdir -p ~/Projects
cd ~/Projects
```

项目目录建议：

```text
~/Projects/3d-cyber-office
```

## 安装步骤

```bash
cd ~/Projects/3d-cyber-office
npm install
npm run doctor
npm run dev:all
```

打开 Vite 打印的本地地址，然后进入 `Migration` 页面导入 JSON。

## 命令对照

| Windows | macOS |
| --- | --- |
| `npm.cmd run dev:all` | `npm run dev:all` |
| `npm.cmd run doctor` | `npm run doctor` |
| `$env:LOCAL_RUNTIME_PORT="19765"` | `LOCAL_RUNTIME_PORT=19765 npm run runtime` |

## Runtime 凭据

迁移包不包含真实 Runtime 凭据。请在 macOS 上重新配置 `.env` 或外部安全 Runtime。

## 验收

- `npm run doctor` 没有 fail。
- `npm run test` 通过。
- `npm run build` 成功。
- Migration 导入成功。
- Gateway 可以连接本地 Runtime。
