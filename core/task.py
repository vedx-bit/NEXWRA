"""
Task — a discrete unit of work assigned to an Agent.

Tasks carry a description, an optional expected-output hint, and a reference
to the agent responsible for completing them.  When tasks are wired together
in a Crew or Flow, the output of one task becomes context for the next.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Callable

if TYPE_CHECKING:
   from core.agent import Agent


@dataclass
class Task:
    """A single unit of work.

    Attributes:
        description: Full description of what needs to be done.
        agent: The Agent responsible for this task.
        expected_output: Optional hint about the desired output format or content.
        context: List of other Task instances whose output feeds into this task.
        callback: Optional function called with the output once the task completes.
        output: Populated automatically after the task runs.
    """

    description: str
    agent: "Agent"
    expected_output: str = ""
    context: list["Task"] = field(default_factory=list)
    callback: Callable[[str], None] | None = None
    output: str = field(default="", init=False)

    # ------------------------------------------------------------------ #
    # Internal helpers used by Crew / Flow                                #
    # ------------------------------------------------------------------ #

    def _get_context_string(self) -> str:
        """Concatenate the outputs of all context tasks into a single string."""
        if not self.context:
            return ""
        parts = []
        for ctx_task in self.context:
            if ctx_task.output:
                parts.append(
                    f"[Output from '{ctx_task.description[:60]}...']\n{ctx_task.output}"
                )
        return "\n\n".join(parts)

    def _mark_complete(self, output: str) -> None:
        """Store result and invoke optional callback."""
        self.output = output
        if self.callback:
            self.callback(output)

    def __repr__(self) -> str:
        preview = self.description[:60]
        return f"Task(description={preview!r}, agent={self.agent.role!r})"
