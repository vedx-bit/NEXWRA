from __future__ import annotations
import json
import re
import textwrap
from dataclasses import dataclass, field
from typing import Any
import sys
import os
sys.path.insert(0, "/mount/src/-agentcrew")
from utils.llm import call_llm
from utils.logger import get_logger

logger = get_logger(__name__)

@dataclass
class Agent:
    role: str
    goal: str
    backstory: str = ""
    tools: list[Any] = field(default_factory=list)
    verbose: bool = False
    max_iterations: int = 10
    model: str = "llama-3.3-70b-versatile"

    def execute_task(self, task, context: str = "") -> str:
        logger.info("[%s] Starting task: %s", self.role, task.description[:80])
        system_prompt = self._build_system_prompt()
        messages = []
        user_content = self._build_task_prompt(task, context)
        messages.append({"role": "user", "content": user_content})

        for iteration in range(1, self.max_iterations + 1):
            if self.verbose:
                logger.debug("[%s] Iteration %d", self.role, iteration)
            response = call_llm(model=self.model, system=system_prompt, messages=messages)
            messages.append({"role": "assistant", "content": response})
            tool_call = self._parse_tool_call(response)
            if tool_call:
                tool_name, tool_input = tool_call
                observation = self._invoke_tool(tool_name, tool_input)
                messages.append({"role": "user", "content": f"Observation: {observation}"})
                continue
            final = self._parse_final_answer(response)
            if final:
                return final
            return response.strip()

        raise RuntimeError(f"Agent '{self.role}' exceeded max_iterations={self.max_iterations}")

    def _build_system_prompt(self) -> str:
        prompt = f"You are {self.role}.\nGoal: {self.goal}"
        if self.backstory:
            prompt += f"\n\nBackstory: {self.backstory}"
        prompt += "\n\nWhen you have completed your work, output EXACTLY:\n<final_answer>\nYour complete answer here.\n</final_answer>"
        return prompt

    def _build_task_prompt(self, task, context: str) -> str:
        parts = [f"Task: {task.description}"]
        if task.expected_output:
            parts.append(f"Expected output format: {task.expected_output}")
        if context:
            parts.append(f"\nContext from previous tasks:\n{context}")
        return "\n\n".join(parts)

    def _parse_tool_call(self, response: str):
        match = re.search(r"<tool_call>\s*(\{.*?\})\s*</tool_call>", response, re.DOTALL)
        if not match:
            return None
        try:
            payload = json.loads(match.group(1))
            return payload["tool"], payload.get("input", {})
        except:
            return None

    def _parse_final_answer(self, response: str):
        match = re.search(r"<final_answer>(.*?)</final_answer>", response, re.DOTALL)
        if match:
            return match.group(1).strip()
        return None

    def _invoke_tool(self, tool_name: str, tool_input: Any) -> str:
        for tool in self.tools:
            if tool.name == tool_name:
                try:
                    return str(tool.run(tool_input))
                except Exception as exc:
                    return f"Tool error: {exc}"
        return f"Unknown tool: '{tool_name}'"
