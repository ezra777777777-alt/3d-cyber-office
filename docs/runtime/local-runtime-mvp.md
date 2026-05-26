# Local Runtime MVP

## 启动方式

推荐：

```powershell
npm.cmd run dev:all
```

分开启动：

```powershell
npm.cmd run runtime
npm.cmd run dev
```

## 健康检查

默认地址：

```text
http://127.0.0.1:8765/health
```

Gateway 页面会显示 Runtime endpoint、buildId、pid、startedAt、planner 和 activeMissionCount。

## Runtime 做什么

- 接收 Commander goal：`POST /missions`
- 推送运行事件：`GET /events`
- 处理审批：`POST /approvals/:approvalId/resolve`
- 提供安全工具请求：`POST /tools/request`
- 生成本地运行产物到 `.local-runtime/`

## Runtime 不做什么

- 不把 API key 放进前端。
- 不把 secret 写入迁移包。
- 不自动执行高风险写入或命令。
- 不自动杀掉旧进程。

## 常见问题

### Gateway 显示 disconnected

1. 运行 `npm.cmd run doctor`。
2. 确认 Runtime 进程仍在运行。
3. 打开 `http://127.0.0.1:8765/health`。
4. 如果端口被旧进程占用，换端口启动 Runtime，并在 Gateway 修改 endpoint。

### PowerShell 不能运行 npm

使用：

```powershell
npm.cmd run dev
npm.cmd run runtime
```

### 端口被旧 Runtime 占用

```powershell
$env:LOCAL_RUNTIME_PORT="19765"
npm.cmd run runtime
```

然后将 Gateway endpoint 改为：

```text
http://127.0.0.1:19765
```

## 相关文档

- `docs/setup/local-startup-guide.md`
- `docs/migration/README.md`
- `docs/runtime/model-planner-setup.md`
- `docs/runtime/safe-tool-execution.md`
