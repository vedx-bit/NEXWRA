"""
Crew — high-level orchestrator that runs a list of tasks autonomously.

The Crew supports two execution strategies:

- ``Process.SEQUENTIAL``  Tasks run one after another; each task receives
  the accumulated output of all previous tasks as context.

- ``Process.HIERARCHICAL``  A designated manager agent breaks the overall
  goal into sub-tasks, delegates them to workers, synthesises results, and
  produces a final answer.  (Requires ``manager_agent`` to be set.)
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

from core.agent import Agent
from core.task import Task
from utils.logger import get_logger
from utils.llm import call_llm

logger = get_logger(__name__)


class Process(Enum):
    """Execution strategy for a Crew."""
    SEQUENTIAL = "sequential"
    HIERARCHICAL = "hierarchical"


@dataclass
class CrewOutput:
    """Result object returned by ``Crew.kickoff()``."""
    raw: str
    task_outputs: list[str] = field(default_factory=list)
    execution_time: float = 0.0
    tasks_completed: int = 0

    def __str__(self) -> str:
        return self.raw


@dataclass
class Crew:
    """Orchestrate a team of agents working on a shared goal.

    Args:
        agents: All agents that belong to this crew.
        tasks: Ordered list of tasks to execute.
        process: Execution strategy — SEQUENTIAL or HIERARCHICAL.
        manager_agent: Required when ``process=Process.HIERARCHICAL``.
        verbose: Enable step-by-step logging.
        memory: If True, accumulated context is passed between all tasks.
    """

    agents: list[Agent]
    tasks: list[Task]
    process: Process = Process.SEQUENTIAL
    manager_agent: Agent | None = None
    verbose: bool = False
    memory: bool = True

    # ------------------------------------------------------------------ #
    # Public API                                                           #
    # ------------------------------------------------------------------ #

    def kickoff(self, inputs: dict[str, Any] | None = None) -> CrewOutput:
        """Start the crew and return a ``CrewOutput`` once all tasks finish.

        Args:
            inputs: Optional dict of variables interpolated into task
                    descriptions using ``{key}`` placeholders.

        Returns:
            A :class:`CrewOutput` with the final answer and metadata.
        """
        if inputs:
            self._interpolate_inputs(inputs)

        start = time.time()
        logger.info("=== Crew kickoff | process=%s | tasks=%d ===",
                    self.process.value, len(self.tasks))

        if self.process == Process.SEQUENTIAL:
            output = self._run_sequential()
        elif self.process == Process.HIERARCHICAL:
            output = self._run_hierarchical()
        else:
            raise ValueError(f"Unknown process: {self.process}")

        elapsed = time.time() - start
        task_outputs = [t.output for t in self.tasks]
        result = CrewOutput(
            raw=output,
            task_outputs=task_outputs,
            execution_time=round(elapsed, 2),
            tasks_completed=sum(1 for t in self.tasks if t.output),
        )
        logger.info("=== Crew finished in %.1fs ===", elapsed)
        return result

    # ------------------------------------------------------------------ #
    # Sequential process                                                   #
    # ------------------------------------------------------------------ #

    def _run_sequential(self) -> str:
        accumulated_context = ""

        for i, task in enumerate(self.tasks, 1):
            logger.info("[%d/%d] Running task → agent: %s", i, len(self.tasks), task.agent.role)

            # Merge explicit context deps + running memory
            context = task._get_context_string()
            if self.memory and accumulated_context:
                context = (context + "\n\n" + accumulated_context).strip()

            output = task.agent.execute_task(task, context=context)
            task._mark_complete(output)

            if self.memory:
                accumulated_context += f"\n\n[{task.agent.role}]: {output}"

            if self.verbose:
                logger.debug("Task output preview: %s", output[:200])

        return self.tasks[-1].output if self.tasks else ""

    # ------------------------------------------------------------------ #
    # Hierarchical process                                                 #
    # ------------------------------------------------------------------ #

    def _run_hierarchical(self) -> str:
        if not self.manager_agent:
            raise ValueError(
                "process=HIERARCHICAL requires a manager_agent to be set on the Crew."
            )

        # Build a summary of available workers and tasks
        worker_summary = "\n".join(
            f"- {a.role}: {a.goal}" for a in self.agents
        )
        task_summary = "\n".join(
            f"{i+1}. {t.description}" for i, t in enumerate(self.tasks)
        )

        delegation_prompt = (
            f"You are managing a crew of agents to accomplish a series of tasks.\n\n"
            f"Available agents:\n{worker_summary}\n\n"
            f"Tasks to complete:\n{task_summary}\n\n"
            f"Coordinate the agents, delegate tasks, collect their outputs, "
            f"and synthesize a comprehensive final answer."
        )

        # Run the standard sequential pipeline first so agents do real work
        sequential_output = self._run_sequential()

        # Then ask the manager to synthesize
        synthesis_prompt = (
            f"Here are the outputs from your agents:\n\n"
            + "\n\n".join(
                f"[{t.agent.role}] {t.description[:60]}:\n{t.output}"
                for t in self.tasks
            )
            + "\n\nPlease synthesize these into a single, comprehensive final answer."
        )

        manager_task = Task(
            description=synthesis_prompt,
            agent=self.manager_agent,
            expected_output="A comprehensive synthesis of all agent outputs.",
        )
        final = self.manager_agent.execute_task(manager_task)
        manager_task._mark_complete(final)
        return final

    # ------------------------------------------------------------------ #
    # Helpers                                                              #
    # ------------------------------------------------------------------ #

    def _interpolate_inputs(self, inputs: dict[str, Any]) -> None:
        for task in self.tasks:
            for key, value in inputs.items():
                task.description = task.description.replace(f"{{{key}}}", str(value))
                task.expected_output = task.expected_output.replace(f"{{{key}}}", str(value))

    def __repr__(self) -> str:
        return (
            f"Crew(agents={len(self.agents)}, tasks={len(self.tasks)}, "
            f"process={self.process.value!r})"
        )
