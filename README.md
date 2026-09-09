# pstack-dsh

[official pstack](https://github.com/cursor/plugins/tree/main/pstack) 的 DeepSeek Harness 移植。23 个玩法和 23 条原则是 [poteto](https://x.com/poteto) 写的。这里只换了调用层，工具名见 [HARNESS.md](./HARNESS.md)。

## 安装

```bash
dsh plugin add github:aa2246740/pstack-dsh
```

本地目录也可以：

```bash
dsh plugin add ./pstack-dsh
```

## 开始用

1. 直接用 [`/poteto-mode`](./skills/poteto-mode/SKILL.md)。不用先跑 setup。子 agent 默认继承当前对话的路由。
2. 要给某个角色钉已登录的路由时，打开 **设置 → pstack**。页面写入 `$DSH_HOME/pstack-dsh.json`。[`/setup-pstack`](./skills/setup-pstack/SKILL.md) 只是指向那一页。

角色列表跟着 DSH 登录、退出和模型目录走，也可以点「刷新模型列表」。刷新只更新候选项，不覆盖尚未保存的角色和 effort。已登录的 `pi-*` / `agy-*` 路由会自动出现。没有 overlay 就继承父对话。不要编造 Cursor 面板 slug。

第一次用可以看 [pstack 指南](./docs/guide/README.md)。

订阅登录要出现在设置页列表里，可按需装 [dsh-oauth-login](https://github.com/aa2246740/dsh-oauth-login) 或 dsh-antigravity-oauth。不是硬依赖。官方 Cursor `/setup-pstack` 会写 `~/.cursor/rules`，不要在 DSH 上跑那份。

## 本次更新

技能内容同步至上游 **pstack 0.15.0**。说明书更精简，新增两条原则，`how` 不再额外启动架构批评代理。

设置页的 **Poteto 0.15 推荐** 仅供参考，不会替换用户已保存的模型或 effort。`how-critics` 输入已隐藏，旧配置保留但不再执行。不包含 Cursor 专用的 `make-bot-ui`。详见 [升级说明](./UPGRADE-0.15.md)。

## 工具

| 工具 | 作用 |
|---|---|
| `pstack_spawn` | 按角色起 DSH 子 agent。不要传 model / effort |
| `pstack_catalog` | 只列出已登录的 live 路由 |
| `pstack_overlay_read` / `pstack_overlay_write` | 读写 `$DSH_HOME/pstack-dsh.json` |
| Settings → pstack | 官方设置页，保存同一份 overlay |

## 开发

```bash
npm install
npm test
npx dshx check pstack-dsh --harness /path/to/deepseek-harness
npx dshx verify-boot pstack-dsh --port 43123
```

不要对用户正在用的 DSH Host 发 `--force`，也不要杀它。对照 [TEST-PLAN.md](./TEST-PLAN.md)。

## 许可

MIT。玩法与原则：Lauren Tan。DSH 移植打包：aa2246740。见 [LICENSE](./LICENSE)。
