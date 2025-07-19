# PromptShield RulePack Registry

Welcome to the RulePack Registry! This page lists official, planned, and community-contributed RulePacks for PromptShield. RulePacks are modular policy files that enable compliance, security, and custom risk detection for LLM projects.

---

## Official RulePacks

| Name               | Description                                 | Status   |
| ------------------ | ------------------------------------------- | -------- |
| pii.yaml           | Detects personally identifiable information | Included |
| bias.yaml          | Detects biased language and stereotypes     | Included |
| hallucination.yaml | Detects unverifiable or hallucinated claims | Included |

---

## Planned RulePacks

| Name           | Description                                 | Status  |
| -------------- | ------------------------------------------- | ------- |
| hipaa.yaml     | US healthcare compliance (PHI detection)    | Planned |
| gdpr.yaml      | EU privacy compliance (PII export, consent) | Planned |
| eu-ai-act.yaml | EU AI Act high-risk use flagging            | Planned |
| api-leak.yaml  | Sensitive API key and secret detection      | Planned |
| toxicity.yaml  | Profanity and hate speech detection         | Planned |
| jailbreak.yaml | Prompt injection and jailbreak detection    | Planned |

---

## Community-Contributed RulePacks

| Name                  | Description                    | Author / Link |
| --------------------- | ------------------------------ | ------------- |
| _Your RulePack here!_ | _Submit a PR to get featured!_ | _You!_        |

---

## How to Submit Your Own RulePack

- Fork the repo and add your RulePack to the `rulepacks/` directory.
- Add a short description and your name or GitHub handle.
- Submit a pull request (PR) to get your RulePack featured here!
- Contributors to official or community RulePacks will be recognized in our docs and GitHub project.

---

**RulePacks are the npm modules of AI security. Help us build a safer, more compliant AI ecosystem!**
