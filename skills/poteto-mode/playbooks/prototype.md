### Prototype

**You own the design decision, not the code. The prototype is throwaway. The real build follows Feature.**

Speed over polish. No production-quality code or planning pass. Pick the design cheaply. Propose variations, throw an approach away, and try another.

1. Scope the decision the prototype exists to make: which layout, interaction, density, behavior, timing, or approach. No decision means no prototype. Route to Feature.
2. Gather references when the design space is open. Search for prior art, summarize a moodboard of themes, palettes, and layouts, let the user pick directions before building. Skip when the direction is set.
3. Build throwaway in an isolated scratch dir, separate from production source. For a visual decision, use vanilla HTML/CSS/JS or the lightest stack that renders the idea, CDN deps, and a dev server with hot reload. For a behavioral or timing decision, use the smallest script that exercises the question. No production framework, no tests, no abstractions.
4. When comparing alternatives, build them behind one switcher with buttons or a keypress. Label each variant. This makes the **exhaust-the-design-space** principle skill cheap to apply.
5. Verify on the matching surface. For a visual decision, screenshot each variant via the control skill and drive the interaction. For a behavioral or timing decision, log the timing, print the output, or watch the render. The observation is the test here, not an assertion.
6. Present alternatives, tradeoffs, and a recommendation. The output is the decision plus the throwaway artifact, not shippable code. Hand the chosen direction to **Feature** or `architect` for the real build.

**Reply:** variants explored, screenshots or observed output and timing, tradeoffs, your recommendation, and the scratch path. Say plainly that the prototype is throwaway.
