"""
Agent — the fundamental unit of work in AgentCrew.

Each agent has a role, a goal, a backstory, and an optional set of tools.
Agents can operate autonomously (deciding their own steps) or be driven
by an explicit Flow pipeline.
"""

from __future__ import annotations

import json
import re
import textwrap
from dataclasses import dataclass, field
from typing import Any

from utils.llm import call_llm
from utils.logger import get_logger

logger = get_logger(__name__)


@dataclass
class Agent:
    """A single AI agent with a defined role and goal.

    Attributes:
        role: Short label describing the agent's persona (e.g. "Senior Researcher").
        goal: What this agent is trying to achieve.
        backstory: Optional context that shapes the agent's reasoning style.
        tools: List of Tool instances the agent may call.
        verbose: If True, logs each reasoning step.
        max_iterations: Safety cap on autonomous reasoning loops.
        model: The underlying LLM model string.
    """

    role: str
    goal: str
    backstory: str = ""
    tools: list[Any] = field(default_factory=list)
    verbose: bool = False
    max_iterations: int = 10
    model: str = "claude-sonnet-4-20250514"

    # ------------------------------------------------------------------ #
    # Public API                                                           #
    # ------------------------------------------------------------------ #

    def execute_task(self, task: "Task", context: str = "") -> str:  # noqa: F821
        """Run a task autonomously using a ReAct-style loop.

        The agent repeatedly reasons about what to do next, optionally calls
        a tool, observes the result, and repeats until it produces a final
        answer or hits *max_iterations*.

        Args:
            task: The Task object to complete.
            context: Optional prior output passed in from upstream tasks.

        Returns:
            The agent's final answer as a plain string.
        """
        logger.info("[%s] Starting task: %s", self.role, task.description[:80])

        system_prompt = self._build_system_prompt()
        messages: list[dict] = []

        # Seed the conversation with the task description + any context
        user_content = self._build_task_prompt(task, context)
        messages.append({"role": "user", "content": user_content})

        for iteration in range(1, self.max_iterations + 1):
            if self.verbose:
                logger.debug("[%s] Iteration %d", self.role, iteration)

            response = call_llm(
                model=self.model,
                system=system_prompt,
                messages=messages,
            )

            messages.append({"role": "assistant", "content": response})

            # Check whether the agent wants to call a tool
            tool_call = self._parse_tool_call(response)
            if tool_call:
                tool_name, tool_input = tool_call
                observation = self._invoke_tool(tool_name, tool_input)
                if self.verbose:
                    logger.debug("[%s] Tool '%s' → %s", self.role, tool_name, observation[:120])
                messages.append({"role": "user", "content": f"Observation: {observation}"})
                continue

            # Check for a final answer marker
            final = self._parse_final_answer(response)
            if final:
                logger.info("[%s] Task complete.", self.role)
                return final

            # If neither, treat the whole response as the final answer
            logger.info("[%s] Task complete (implicit).", self.role)
            return response.strip()

        raise RuntimeError(
            f"Agent '{self.role}' exceeded max_iterations={self.max_iterations} "
            f"without producing a final answer."
        )

    # ------------------------------------------------------------------ #
    # Private helpers                                                      #
    # ------------------------------------------------------------------ #

    def _build_system_prompt(self) -> str:
        tool_descriptions = self._format_tool_descriptions()

        prompt = textwrap.dedent(f"""
            You are {self.role}.
            Goal: {self.goal}
        """).strip()

        if self.backstory:
            prompt += f"\n\nBackstory: {self.backstory}"

        if tool_descriptions:
            prompt += f"\n\n## Available Tools\n{tool_descriptions}"
            prompt += textwrap.dedent("""

                ## How to use tools
                When you need to use a tool, output EXACTLY this format (nothing else on that turn):
                <tool_call>
                {{"tool": "<tool_name>", "input": <json_input>}}
                </tool_call>

                After you receive the observation, continue reasoning.
                When you have a complete answer, output EXACTLY:
                <final_answer>
                Your complete answer here.
                </final_answer>
            """)
        else:
            prompt += textwrap.dedent("""

                When you have completed your work, output EXACTLY:
                <final_answer>
                Your complete answer here.
                </final_answer>
            """)

        return prompt

    def _build_task_prompt(self, task: "Task", context: str) -> str:  # noqa: F821
        parts = [f"Task: {task.description}"]
        if task.expected_output:
            parts.append(f"Expected output format: {task.expected_output}")
        if context:
            parts.append(f"\nContext from previous tasks:\n{context}")
        return "\n\n".join(parts)

    def _format_tool_descriptions(self) -> str:
        if not self.tools:
            return ""
        lines = []
        for tool in self.tools:
            lines.append(f"- **{tool.name}**: {tool.description}")
        return "\n".join(lines)

    def _parse_tool_call(self, response: str) -> tuple[str, Any] | None:
        match = re.search(r"<tool_call>\s*(\{.*?\})\s*</tool_call>", response, re.DOTALL)
        if not match:
            return None
        try:
            payload = json.loads(match.group(1))
            return payload["tool"], payload.get("input", {})
        except (json.JSONDecodeError, KeyError):
            return None

    def _parse_final_answer(self, response: str) -> str | None:
        match = re.search(r"<final_answer>(.*?)</final_answer>", response, re.DOTALL)
        if match:
            return match.group(1).strip()
        return None

    def _invoke_tool(self, tool_name: str, tool_input: Any) -> str:
        for tool in self.tools:
            if tool.name == tool_name:
                try:
                    return str(tool.run(tool_input))
                except Exception as exc:  # noqa: BLE001
                    return f"Tool error: {exc}"
        return f"Unknown tool: '{tool_name}'"

    def __repr__(self) -> str:
        return f"Agent(role={self.role!r})"
