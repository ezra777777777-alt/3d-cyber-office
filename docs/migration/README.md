# 3D 赛博办公室迁移指南

如果你要把项目迁移到另一台电脑，按目标系统阅读：

1. `windows-to-windows.md`：Windows 到 Windows。
2. `windows-to-mac.md`：Windows 到 macOS。
3. `3d-cyber-office-data-migration.md`：浏览器本地数据导出/导入。
4. `migration-checklist.md`：迁移检查清单。
5. `troubleshooting.md`：常见问题排查。
6. `../setup/local-startup-guide.md`：本地启动指南。
7. `../qa/final-acceptance-checklist.md`：迁移后验收。

## 重要提醒

迁移包不会包含：

- Runtime/API key
- token
- password
- `.env`
- `.env.*`
- `node_modules/`
- `dist/`

换电脑后，请在新的安全 Runtime 环境里重新配置模型供应商凭据。
