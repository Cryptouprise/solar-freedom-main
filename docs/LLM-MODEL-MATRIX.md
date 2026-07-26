# LLM Model Selection Matrix — Solar Freedom Agent System
*Last updated: July 2026 | Source: OpenRouter + Swfte Leaderboard*

---

## THE FULL LANDSCAPE (July 2026)

### TIER 1 — Frontier (Best Quality, High Cost)

| Model | Quality Score | Arena ELO | Speed | Input $/M | Output $/M | Context | Best At |
|-------|--------------|-----------|-------|-----------|------------|---------|---------|
| **Claude Fable 5** | 100/100 | 1525 | 58 t/s | $10 | $50 | 1M | Absolute best. Agentic coding, long-horizon tasks, knowledge work |
| **Claude Opus 4.8** | 99/100 | 1512 | 72 t/s | $5 | $25 | 1M | Coding, agents, computer use. Best value in Tier 1 |
| **GPT-5.5 Pro** | 98/100 | 1510 | 68 t/s | $30 | $180 | 1M | Reasoning at any cost. Overkill for most tasks |
| **GPT-5.6** | 98/100 | 1514 | 96 t/s | $5 | $30 | 400K | Fast frontier. Good balance of speed + quality |
| **Kimi K3** | 98/100 | 1500 | 55 t/s | $3 | $15 | 1M | Open-weight frontier. Excellent value vs Claude |
| **Gemini 3.2 Pro** | 97/100 | 1508 | 128 t/s | $2 | $12 | 2M | Fastest frontier. Long-context king (2M tokens) |
| **Gemini 3.1 Pro** | 96/100 | 1505 | 131 t/s | $2 | $12 | 1M | Science, long-context, speed. Best Google model |
| **Claude Sonnet 5** | 93/100 | 1479 | 98 t/s | $3 | $15 | 1M | Balanced agents + coding. Best mid-tier Anthropic |

---

### TIER 2 — High Value (Near-Frontier Quality, Much Lower Cost)

| Model | Quality Score | Arena ELO | Speed | Input $/M | Output $/M | Context | Best At |
|-------|--------------|-----------|-------|-----------|------------|---------|---------|
| **Grok 4.3** | 93/100 | 1496 | 83 t/s | $1.25 | $2.50 | 1M | **Best value in Tier 2.** Real-time info, agentic tasks |
| **Qwen3.7 Max** | 94/100 | 1488 | 90 t/s | $2.50 | $7.50 | 1M | Long autonomous agentic runs. Alibaba's best |
| **DeepSeek V4.5** | 92/100 | 1471 | 62 t/s | $0.50 | $1.10 | 256K | **Insane value.** Open-weight reasoning. 92 quality at $1.10/M out |
| **Kimi K2.6** | 92/100 | 1466 | 48 t/s | $0.73 | $3.49 | 256K | Frontier quality at low cost. Moonshot AI |
| **GPT-5.4** | 93/100 | 1495 | — | $2.50 | $15 | 1M | General purpose. Reliable, well-rounded |
| **Gemini 2.5 Pro** | 92/100 | 1345 | 87 t/s | $1.25 | $10 | 1M | Multimodal + value. What we're using now |
| **Llama 5** | 91/100 | 1466 | 76 t/s | $0.80 | $2.40 | 1M | Open-weight general. Meta's best. Good for volume |

---

### TIER 3 — Reasoning Specialists (Deep Thinking, Not Speed)

| Model | Quality Score | Arena ELO | Speed | Input $/M | Output $/M | Context | Best At |
|-------|--------------|-----------|-------|-----------|------------|---------|---------|
| **DeepSeek R1 0528** | 91/100 | — | — | $0.50 | $2.15 | 164K | Hard reasoning, math, multi-step logic. Matches o1 |
| **DeepSeek R1T2 Chimera** | 91/100 | — | — | $0.30 | $1.10 | 164K | Hard reasoning at lowest cost. Community fine-tune |
| **Nex AGI Nexus N2 Pro** | 91/100 | — | 50 t/s | $0.20 | $0.80 | 262K | Open-weight reasoning + tool use. Dirt cheap |
| **DeepSeek V4 Pro** | 90/100 | 1467 | 33 t/s | $1.74 | $3.48 | 1M | Open-source value leader. Full 1M context |
| **o3 Mini** | 88/100 | 1305 | 155 t/s | $1.10 | $4.40 | 200K | Fast reasoning. Good for structured analysis |

---

### TIER 4 — Speed & Volume (Fast, Cheap, Good Enough)

| Model | Quality Score | Arena ELO | Speed | Input $/M | Output $/M | Context | Best At |
|-------|--------------|-----------|-------|-----------|------------|---------|---------|
| **Gemini 3.6 Flash** | — | — | — | $1.50 | $7.50 | 1M | Coding, agentic workflows, web dev. Latest Flash |
| **Gemini 3.5 Flash Lite** | — | — | — | $0.30 | $2.50 | 1M | Subagents in multi-agent workflows. Ultra cheap |
| **DeepSeek V3.2** | 87/100 | 1455 | — | $0.25 | $0.38 | 164K | **Cheapest capable model.** Structured output, analysis |
| **Kimi K2.5** | 89/100 | 1452 | — | $0.40 | $1.90 | 262K | Speed + cost. Near-frontier at budget price |
| **MiniMax M3** | 89/100 | 1455 | 80 t/s | $0.60 | $2.40 | 1M | Open-weight agentic coding. Fast + cheap |
| **GLM 5.2** | 89/100 | — | — | $0.98 | $3.08 | 200K | Agentic coding. Chinese frontier model |
| **Qwen3 235B A22B** | — | — | — | ~$0.20 | ~$0.60 | 128K | **Best price-to-quality ratio on the board.** Alibaba |
| **Ling-3.0-flash** | — | — | — | FREE | FREE | 262K | Free tier. 124B MoE. Good for testing/volume |

---

## TASK-TYPE MATCHING GUIDE

### Long-Form Writing (Content Agent — 2,500+ word articles)
**Winner: Claude Opus 4.8 or Kimi K3**
- Claude Opus 4.8: Best prose quality, sounds most human, best instruction following. $5/$25.
- Kimi K3: Near-identical quality at $3/$15. Open-weight. Strong alternative.
- Avoid: DeepSeek for writing. It's brilliant at reasoning but articles sound slightly robotic.

### Revenue Decisions & Multi-Step Reasoning (Money Maker, Manager)
**Winner: DeepSeek V4.5 or Grok 4.3**
- DeepSeek V4.5: 92/100 quality at $0.50/$1.10. Insane value for financial analysis.
- Grok 4.3: 93/100 at $1.25/$2.50. Real-time info access. Best for attorney research.
- Current (Gemini 2.5 Pro): 92/100 at $1.25/$10. Paying 9x more for same quality.

### Structured Analysis & JSON Output (SEO Intel)
**Winner: DeepSeek V3.2 or Qwen3 235B**
- DeepSeek V3.2: $0.25/$0.38. Excellent at structured JSON. 87/100 quality. Cheapest capable.
- Qwen3 235B: ~$0.20/$0.60. Best price-to-quality on the entire board.
- Both are dramatically cheaper than Gemini Flash for this task type.

### Quality Review & Rubric Scoring (Editor Agent)
**Winner: Gemini 3.5 Flash Lite or DeepSeek V3.2**
- This is a mechanical task: score against a rubric, output JSON. Doesn't need a frontier model.
- Gemini 3.5 Flash Lite: $0.30/$2.50. Built for subagent tasks exactly like this.
- DeepSeek V3.2: $0.25/$0.38. Even cheaper, still reliable for structured scoring.

### Final Approval & Oversight (Manager Agent)
**Winner: Grok 4.3 or Kimi K3**
- Grok 4.3: 93/100 at $1.25/$2.50. Real-time info. Best value for judgment calls.
- Kimi K3: 98/100 at $3/$15. Near-Claude quality. Worth it for final approval gate.
- Current (Gemini 2.5 Pro): Paying $10/M output for 92/100. Grok 4.3 beats it at 1/4 the cost.

---

## RECOMMENDED AGENT MODEL ASSIGNMENTS

| Agent | Current Model | Recommended Model | Why | Cost Savings |
|-------|--------------|-------------------|-----|--------------|
| **Money Maker** | Gemini 2.5 Pro ($10/M out) | **DeepSeek V4.5** ($1.10/M out) | Same 92/100 quality, 9x cheaper | ~90% |
| **SEO Intel** | Gemini 2.5 Flash Lite | **DeepSeek V3.2** ($0.38/M out) | Structured JSON analysis, cheapest capable | ~50% |
| **Content Agent** | Gemini 2.5 Flash | **Claude Opus 4.8** ($25/M out) | Best prose quality. Articles rank better. Worth the premium. | -300% (upgrade) |
| **Editor Agent** | Gemini 2.5 Flash | **Gemini 3.5 Flash Lite** ($2.50/M out) | Built for subagent rubric tasks. Cheaper. | ~70% |
| **Manager Agent** | Gemini 2.5 Pro ($10/M out) | **Grok 4.3** ($2.50/M out) | 93/100 vs 92/100 quality, 4x cheaper, real-time info | ~75% |

**Net effect:** Content Agent costs more (worth it for ranking). Everything else costs 75-90% less. Overall system cost drops ~60% while quality goes UP on the tasks that matter most (writing).

---

## MODELS TO WATCH

- **Claude Opus 5** (Jul 24, 2026): $5/$25, 1M context. Just dropped. May replace Opus 4.8 as the writing standard.
- **Gemini 3.6 Flash** (Jul 21, 2026): $1.50/$7.50. New Flash. May be worth testing for Editor Agent.
- **Ling-3.0-flash** (Jul 23, 2026): **FREE on OpenRouter.** 124B MoE. Worth testing for SEO Intel.
- **DeepSeek V4.5** (Jul 2026): Just dropped. 92/100 at $0.50/$1.10. Best new value model.

---

## HOW TO SWAP MODELS

All model assignments live in one place: `server/agents/engine.ts` → `AGENT_MODELS` constant.

```typescript
export const AGENT_MODELS = {
  money_maker: "deepseek/deepseek-v4.5",
  seo_intel:   "deepseek/deepseek-v3.2",
  content:     "anthropic/claude-opus-4-8",
  editor:      "google/gemini-3.5-flash-lite",
  manager:     "x-ai/grok-4.3",
};
```

Change one line, all runs for that agent use the new model. No other code changes needed.
