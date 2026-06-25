---
description: "Code quality and maintainability instructions."
applyTo: "**/*"
---

Before jumping into a solution, consider if some refactoring or restructuring of the code is needed to make the solution more efficient and maintainable.
Proceed with local refactors that are necessary for the task; ask for confirmation before larger restructuring that changes public APIs, ownership boundaries, or broad execution flow.

Avoid brittle local fixes.
Aggressively remove legacy code when it is unused, superseded, or made obsolete by the change, unless prompted to preserve it.
Apply the YAGNI principle (You Aren't Gonna Need It).
Avoid over-engineering and unnecessary abstraction.
We aim for a concise, clear and opinionated code base with a clear execution flow.

For example:

- Do change an input type from string to number if that makes the code clearer and more maintainable, and update callers accordingly.
- Do not add a local string-to-number conversion if the real fix is to correct the input type.
- Do not make an input type a union of string and number purely to preserve backwards compatibility.
- When choosing between a complex solution that covers speculative cases and a simpler solution that covers expected use cases, prefer the simpler solution unless prompted otherwise.
