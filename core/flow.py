"""
Flow — fine-grained, step-by-step workflow orchestration.

A Flow lets you define an explicit directed pipeline of steps.  Each step
is a Python method decorated with ``@step`` (or ``@start`` for the entry
point).  Control is passed between steps explicitly via return values:

- Return a string → route to the step whose name matches.
- Return ``None``  → end the flow.

Within any step you can call ``self.run_task(task)`` to have an agent
execute a :class:`~agentcrew.core.task.Task` and capture the result.

State shared across steps lives in ``self.state`` (a plain dict).

Example
-------
::

    from agentcrew import Agent, Task, Flow, start, step

    class ResearchFlow(Flow):
        @start
        def gather_data(self):
            out = self.run_task(Task("Find market data", agent=researcher))
            self.state["data"] = out
            return "write_report"

        @step
        def write_report(self):
            out = self.run_task(Task(
                f"Write report from: {self.state['data']}", agent=writer
            ))
            self.state["report"] = out

    flow = ResearchFlow()
    result = flow.kickoff()
"""

from __future__ import annotations

import inspect
import time
from typing import Any, Callable

from core.task import Task
from utils.logger import get_logger
logger = get_logger(__name__)

# ------------------------------------------------------------------ #
# Decorators                                                           #
# ------------------------------------------------------------------ #

_START_ATTR = "_flow_start"
_STEP_ATTR = "_flow_step"


def start(fn: Callable) -> Callable:
    """Mark a Flow method as the entry point."""
    setattr(fn, _START_ATTR, True)
    setattr(fn, _STEP_ATTR, True)
    return fn


def step(fn: Callable) -> Callable:
    """Mark a Flow method as a routable step."""
    setattr(fn, _STEP_ATTR, True)
    return fn


def router(fn: Callable) -> Callable:
    """Alias for ``@step`` — semantically indicates a routing decision."""
    setattr(fn, _STEP_ATTR, True)
    setattr(fn, "_flow_router", True)
    return fn


# ------------------------------------------------------------------ #
# FlowOutput                                                           #
# ------------------------------------------------------------------ #

class FlowOutput:
    """Result object returned by ``Flow.kickoff()``."""

    def __init__(self, state: dict, steps_executed: list[str], execution_time: float):
        self.state = state
        self.steps_executed = steps_executed
        self.execution_time = execution_time

    @property
    def final(self) -> Any:
        """Convenience: return ``state['final']`` if present, else the whole state."""
        return self.state.get("final", self.state)

    def __str__(self) -> str:
        return str(self.final)

    def __repr__(self) -> str:
        return (
            f"FlowOutput(steps={self.steps_executed}, "
            f"time={self.execution_time}s)"
        )


# ------------------------------------------------------------------ #
# Base Flow class                                                      #
# ------------------------------------------------------------------ #

class Flow:
    """Base class for all flows.  Subclass this and decorate methods.

    Attributes:
        state: Shared mutable dictionary available to every step.
    """

    def __init__(self) -> None:
        self.state: dict[str, Any] = {}
        self._steps: dict[str, Callable] = {}
        self._start_step: str | None = None
        self._steps_executed: list[str] = []
        self._discover_steps()

    # ------------------------------------------------------------------ #
    # Public API                                                           #
    # ------------------------------------------------------------------ #

    def kickoff(self, inputs: dict[str, Any] | None = None) -> FlowOutput:
        """Execute the flow from the ``@start`` step.

        Args:
            inputs: Optional seed values merged into ``self.state``.

        Returns:
            A :class:`FlowOutput` with the final state and metadata.
        """
        if inputs:
            self.state.update(inputs)

        if not self._start_step:
            raise RuntimeError(
                "No @start step found. Decorate exactly one method with @start."
            )

        start_time = time.time()
        logger.info("=== Flow kickoff | start=%s ===", self._start_step)

        current = self._start_step
        while current:
            if current not in self._steps:
                raise RuntimeError(
                    f"Flow routing error: step '{current}' does not exist. "
                    f"Available steps: {list(self._steps)}"
                )
            logger.info("[Flow] Executing step: %s", current)
            self._steps_executed.append(current)
            result = self._steps[current]()
            current = result if isinstance(result, str) else None

        elapsed = round(time.time() - start_time, 2)
        logger.info("=== Flow finished in %.1fs | steps=%s ===", elapsed, self._steps_executed)
        return FlowOutput(
            state=dict(self.state),
            steps_executed=list(self._steps_executed),
            execution_time=elapsed,
        )

    def run_task(self, task: Task, context: str = "") -> str:
        """Execute a :class:`~agentcrew.core.task.Task` inside a flow step.

        This is the primary way flow steps delegate work to agents.

        Args:
            task: The task to run.
            context: Additional context string passed to the agent.

        Returns:
            The agent's output string.
        """
        ctx = context or task._get_context_string()
        output = task.agent.execute_task(task, context=ctx)
        task._mark_complete(output)
        return output

    # ------------------------------------------------------------------ #
    # Internals                                                            #
    # ------------------------------------------------------------------ #

    def _discover_steps(self) -> None:
        for name, method in inspect.getmembers(self, predicate=inspect.ismethod):
            if getattr(method, _STEP_ATTR, False):
                self._steps[name] = method
                if getattr(method, _START_ATTR, False):
                    if self._start_step:
                        raise RuntimeError(
                            f"Multiple @start steps found: '{self._start_step}' and '{name}'. "
                            "Only one is allowed."
                        )
                    self._start_step = name

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(steps={list(self._steps)})"
