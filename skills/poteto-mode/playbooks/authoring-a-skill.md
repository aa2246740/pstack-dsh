### Authoring or modifying a skill

**You own the skill's voice.**

1. Write `SKILL.md` with a kebab-case `name` matching `^[a-z0-9]+(?:-[a-z0-9]+)*$`. DSH drops `name: Poteto Mode`. This port does not ship Cursor `create-skill`.
2. Validate the skill: frontmatter has `name` and `description`, referenced files exist, cross-skill links resolve.
3. Test cases if structural. Skip if subjective.
4. Run **Opening a PR**.

When in doubt, delete. Keep only prose that changes a decision. Tell it to do the thing and skip the reason. Explain only when the rule is confusing without one. Match tone to scope. Point at structural sources such as types, READMEs, and config per the **encode-lessons-in-structure** principle skill. Delegate to other skills by path. Don't restate. Propose a new skill for a recurring workflow that isn't captured.

**Reply:** summary of the skill, key design decisions, validation notes.
