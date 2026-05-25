# Migration Troubleshooting

## npm 找不到 package.json

原因：当前目录不是项目根目录。

解决：

```powershell
cd "D:\projects\3d-cyber-office"
npm.cmd run build
```

## macOS 安装依赖失败

解决：

```bash
rm -rf node_modules
npm install
```

## 页面端口不是 5173

Vite 会自动换端口。使用终端打印的实际地址。

## 导入 JSON 被 blocked

原因可能是迁移包里含有 token、password、authorization 或 schema 不匹配。

解决：

1. 不要手动加入凭据。
2. 从旧电脑 Migration 页面重新导出。
3. 确认迁移健康检查错误信息。

## 中文路径问题

如果某些工具无法处理中文路径，请使用英文目录：

```text
D:\projects\3d-cyber-office
~/Projects/3d-cyber-office
```

## 真实 AI Runtime 不能用

迁移包不会带凭据。请在新机器的外部 Runtime 中重新配置 API key 或本地服务。
