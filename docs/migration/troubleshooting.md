# 迁移问题排查

## npm 找不到 package.json

原因：当前目录不是项目根目录。

解决：

```powershell
cd "D:\projects\3d-cyber-office"
npm.cmd run doctor
```

## PowerShell 禁止 npm.ps1

使用 `npm.cmd`：

```powershell
npm.cmd run build
```

## node_modules 不能跨系统复制

删除后重新安装：

```powershell
Remove-Item -Recurse -Force node_modules
npm install
```

macOS：

```bash
rm -rf node_modules
npm install
```

## Vite 端口不是 5173

Vite 会自动换端口。使用终端打印的实际地址。

## Runtime 端口被占用

检查：

```powershell
npm.cmd run check:ports
```

换端口：

```powershell
$env:LOCAL_RUNTIME_PORT="19765"
npm.cmd run runtime
```

然后在 Gateway 里把 endpoint 改成 `http://127.0.0.1:19765`。

## 导入 JSON 被 blocked

可能原因：

- 迁移包里含 token/password/authorization。
- schema 不匹配。
- JSON 被手动改坏。

解决：

1. 不要手动加入凭据。
2. 从旧电脑 Migration 页面重新导出。
3. 重新预览导入。

## 真实 AI Runtime 不能用

迁移包不会带凭据。请在新机器的外部 Runtime 中重新配置 API key 或本地模型服务。
