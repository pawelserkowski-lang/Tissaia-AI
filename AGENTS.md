# Agent Protocols (AGENTS.md)

This file contains mandatory instructions for AI agents (Jules) working on the Tissaia repository.

## 1. Workflow Automation: Automatic Submission
**Protocol: ALWAYS_SUBMIT**
* **Trigger:** At the conclusion of every task or session.
* **Action:** You **MUST** automatically call the `submit` tool.
* **Requirement:** Do not ask for permission to submit. Assume the user wants the changes pushed to GitHub and a PR created immediately.
* **Reasoning:** This ensures that the code repository is always up-to-date, allowing the user to "reload" (pull) the latest changes instantly.

## 2. Guideline Enforcement
* This file serves as the source of truth for agent behavior.
* It ensures that every interaction results in a tangible code contribution (PR).

## 3. Component Integrity & Auto-Update
* **Launchers:** Maintain `LAUNCH_TISSAIA.bat`, `START_TISSAIA.cmd`, and `start.sh` as critical entry points.
* **Auto-Update Strategy:** These launchers are configured to execute `git pull` on startup. Do not remove this functionality. It fulfills the user's requirement to "reload the code" automatically when they start the session.
