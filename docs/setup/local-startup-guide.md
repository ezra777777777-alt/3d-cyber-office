# 本地启动指南

## 推荐方式

在项目根目录运行：

```powershell
npm.cmd run dev:all
```

这会同时启动：

- 前端 Vite 应用
- 本地 Runtime

终端会打印两个地址：

- `Vite`: 浏览器打开这个地址
- `Runtime`: Gateway 使用这个端点

## 分开启动

如果你想分别看日志，可以开两个终端。

终端 1：

```powershell
npm.cmd run runtime
```

终端 2：

```powershell
npm.cmd run dev
```

## 检查环境

```powershell
npm.cmd run doctor
```

## 检查端口

```powershell
npm.cmd run check:ports
```

## 端口被占用

Runtime 默认端口是 `8765`。如果被占用，可以换端口：

```powershell
$env:LOCAL_RUNTIME_PORT="19765"
npm.cmd run runtime
```

然后在 Gateway 里把端点改成：

```text
http://127.0.0.1:19765
```

## macOS

macOS 使用同样的 npm script，但命令通常写成：

```bash
npm run dev:all
npm run doctor
npm run check:ports
```

如果要换 Runtime 端口：

```bash
LOCAL_RUNTIME_PORT=19765 npm run runtime
```

## 不要迁移的内容

不要复制这些目录或文件到另一台机器：

- `node_modules/`
- `dist/`
- `.vite/`
- `.env`
- `.env.*`
- `.local-runtime/` 中的临时运行输出，除非你明确要保留历史产物

API key、token、password 不会进入迁移包。换电脑后在安全 Runtime 环境里重新配置。
