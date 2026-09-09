### Visual parity

**You own pixel-exact equivalence. The baseline is the spec. You do not touch it.** Verify equivalence by image diff, not by eye.

1. Establish the baseline before any migration. Use a visual regression harness that screenshots the current component across its states, plus the target when matching two implementations. No baseline, no parity claim.
2. Hold the anti-shortcut rules: no harness modifications, no baseline tampering, no component restructuring to make a diff pass. If the baseline looks wrong, stop and ask, don't edit it.
3. Migrate one component at a time. Parallelize across worktrees, one owner per component per the **separate-before-serializing-shared-state** principle skill. Shared components migrate first as a blocking phase.
4. Verify each component against its baseline by image diff on the matching surface via the control skill. A nonzero diff is a fail. Investigate the pixel delta. Use goal-based continued execution from `playbooks/autonomous-run.md` for a long migration, verifying each component until its diff is zero. Do not alter the predicate to declare completion.
5. Run **Opening a PR** per component or per safe batch.

**Reply:** components migrated, the diff result for each, the baseline harness location, what's left.
