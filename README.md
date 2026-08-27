# official pstack 的 DeepSeek Harness 移植

**English title.** pstack-dsh, a DeepSeek Harness port of official pstack.

**中文.** 这是 official pstack 的 DeepSeek Harness 移植。玩法和原则来自 poteto 的 official pstack；只有调用层换成 DSH。

**English.** This is a DeepSeek Harness port of official pstack. Playbooks and principles are poteto's. Only the harness call layer is swapped.

## 来源 / Credits

22 个玩法（playbooks）和 21 条原则（principles）是 [poteto](https://x.com/poteto) 写的，出自 [official pstack](https://github.com/cursor/plugins/tree/main/pstack)。本仓库是 DeepSeek Harness 移植（[aa2246740/pstack-dsh](https://github.com/aa2246740/pstack-dsh)）。调用层用 [HARNESS.md](./HARNESS.md) 里的 DSH 工具名。玩法和原则不是本仓库写的。

The 22 playbooks and 21 principles are [poteto](https://x.com/poteto)'s, from [official pstack](https://github.com/cursor/plugins/tree/main/pstack). This repository is the DeepSeek Harness port ([aa2246740/pstack-dsh](https://github.com/aa2246740/pstack-dsh)). Harness calls use DSH tools named in [HARNESS.md](./HARNESS.md). This port did not author those playbooks or principles.

## 安装 / Install

```bash
dsh plugin add github:aa2246740/pstack-dsh
```

本地目录也可以：

A local checkout also works:

```bash
dsh plugin add ./pstack-dsh
```

工具对照见 [HARNESS.md](./HARNESS.md)。工作台是 [dshx](https://github.com/aa2246740/dsh-external-plugin-devkit)，用来 `check` / `verify-boot`。不要用它当 DSH 发行版。

Tool mapping is in [HARNESS.md](./HARNESS.md). [dshx](https://github.com/aa2246740/dsh-external-plugin-devkit) is the out-of-process workbench for `check` / `verify-boot`. It is not a DSH fork.

## 开始用 / Get started

两步。

Two steps.

1. 要做事、要严谨，直接用 [`/poteto-mode`](./skills/poteto-mode/SKILL.md)。不用先跑 setup。子 agent 默认继承当前对话的路由。
2. 只有想给某个角色换已登录的路由时，打开 **设置 → pstack**（导航「pstack 角色」/「pstack roles」）。页面写入 `$DSH_HOME/pstack-dsh.json`。[`/setup-pstack`](./skills/setup-pstack/SKILL.md) 只是指向那一页的指针。

1. Use [`/poteto-mode`](./skills/poteto-mode/SKILL.md) for work that needs rigor. No setup required. Children inherit this conversation's route.
2. To pin a logged-in route per role, open **Settings → pstack** (nav label **pstack 角色** / **pstack roles**). The page writes `$DSH_HOME/pstack-dsh.json`. [`/setup-pstack`](./skills/setup-pstack/SKILL.md) is an optional pointer to that page.

角色模型列表会随 DSH 的登录、退出登录和模型目录变更通知更新，也可点击「刷新模型列表」。刷新只更新候选项，不覆盖尚未保存的角色和 effort；当前选择若失去登录会标为「暂不可用」。新加入 dsh-oauth-login 的 `pi-*` 路由只要已登录且已注册，就会自动纳入，无需在 pstack 里再维护一份提供商名单。

Model choices follow DSH login/logout and catalog notifications. **Refresh models** also updates the choices without replacing unsaved role/effort edits. A selected route that becomes unavailable stays visibly marked. Newly registered, signed-in `pi-*` routes are discovered without a second provider allowlist.

第一次用可以看 [pstack 指南](./docs/guide/README.md)。

New here? The [pstack guide](./docs/guide/README.md) walks through a first real task.

其余技能是按需的。`/poteto-mode` 会在步骤需要时自己去调。

The other skills are situational. The mode skill uses them when a step needs them.

## 默认模型与 effort / Defaults

装完就能用，不必先打开设置，也不必跑 `/setup-pstack`。

A fresh install is usable without Settings → pstack and without `/setup-pstack`.

**模型 / Model.** 不要发送 `model`，除非 live catalog 里已经有这一条。没有 overlay 就继承父对话。不要编造 Cursor 面板 slug（`grok-4.6-fast-xhigh`、`gpt-5.6-sol-max`、`claude-fable-5-thinking-max`、`claude-opus-5-thinking-xhigh`）。

Do not send `model` unless that pair was detected live. Missing overlay inherits the parent. Do not invent Cursor panel slugs.

**effort.** 只提供该路由 `resolveModelInfo().reasoning.efforts` 列出的 id。没有 effort 字段就省略。skill 从不在 spawn 上发送 `reasoning_effort` 或 `thinking`。官方 `subagent` schema 没有这些字段。角色 effort 写在 overlay 里，由 `agent/request` 落到 `LlmCallConfig.reasoningEffort`。

Effort is only the ids that route actually accepts. If the route has none, omit it. Skills never send `reasoning_effort` or `thinking` on spawn. Official `subagent` has no such field. Role effort lives in the overlay and is applied on `agent/request`.

**设置 / Settings.** 配置页是官方 Settings 里的 `settings.section`（id `pstack`，order 16）。只列出已登录路由；effort 只列出该路由 live `resolveModelInfo().reasoning.efforts`。空列表就是继承父对话。保存写同一份 overlay，不是第二份配置。

The editor is the official Settings `settings.section` (id `pstack`, order 16). It lists logged-in routes only. Effort options are that route's live `resolveModelInfo().reasoning.efforts`. An empty list means inherit the parent. Save writes the same overlay, not a second file.

设置页只列出已经登录的 API key 路由，以及 dsh-oauth-login 仓库里已经签过名、并且 `pi-*` 适配器已注册的路由。空目录就是继承父对话。

## 推荐依赖 / Recommended peer

订阅登录（ChatGPT / Claude / Grok / Copilot / OpenRouter / Kimi）要出现在 **设置 → pstack** 列表里，需要另装 [dsh-oauth-login](https://github.com/aa2246740/dsh-oauth-login)。不是硬依赖。只用 API key 的用户可以不装。本插件不读写 `~/.pi`、`~/.codex`、`~/.claude`、grok CLI 登录文件。

Subscription logins show up on **Settings → pstack** after you install [dsh-oauth-login](https://github.com/aa2246740/dsh-oauth-login). It is not required. API-key-only users work without it. This plugin does not read or write official CLI auth files.

```bash
dsh plugin add github:aa2246740/dsh-oauth-login
```

## 这不是 Cursor 插件 / Not the Cursor plugin

这里的角色映射在 **设置 → pstack**。官方 Cursor `/setup-pstack` 会写 `~/.cursor/rules`，并用 Cursor 的模型名。不要在 DSH 上跑那份。

Role mapping in this repo is **Settings → pstack**. Official Cursor `/setup-pstack` writes `~/.cursor/rules` and uses Cursor slugs. Do not run it here.

## 工具 / Tools

本插件注册：

This plugin registers:

| 工具 / Tool | 作用 / Role |
|---|---|
| `pstack_spawn` | 按角色起 DSH 子 agent。不要传 model / effort。 |
| `pstack_catalog` | 只列出已登录的 live 路由。 |
| `pstack_overlay_read` / `pstack_overlay_write` | 读写 `$DSH_HOME/pstack-dsh.json`。 |
| Settings → pstack | 官方设置页。保存同一份 overlay。 |

技能入口：`/poteto-mode`，以及 bundled 的 playbook / principle skills。[`/setup-pstack`](./skills/setup-pstack/SKILL.md) 指向设置页。

Slash entry: `/poteto-mode`, plus the bundled playbook and principle skills. [`/setup-pstack`](./skills/setup-pstack/SKILL.md) points at the Settings page.

## 开发 / Develop

```bash
npm install
npm test
npx dshx check pstack-dsh --harness /path/to/deepseek-harness
npx dshx verify-boot pstack-dsh --port 43123
```

不要对用户正在用的 DSH Host 发 `--force`，也不要杀它。`verify-boot` 只允许隔离冷启动。对照 [TEST-PLAN.md](./TEST-PLAN.md)。

Do not `--force` or kill a user's live DSH Host. `verify-boot` is isolated cold boot only. See [TEST-PLAN.md](./TEST-PLAN.md).

## 许可 / License

MIT。玩法与原则：Lauren Tan。DSH 移植打包：aa2246740。见 [LICENSE](./LICENSE)。

MIT. Playbooks and principles: Lauren Tan. DSH port packaging: aa2246740. See [LICENSE](./LICENSE).
