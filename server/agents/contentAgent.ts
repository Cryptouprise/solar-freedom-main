/**
 * Content Agent — Solar Freedom
 *
 * ONE JOB: Write content that ranks, converts, and makes money.
 *
 * Every article this agent writes must:
 * 1. Rank on Google for a keyword that distressed homeowners search
 * 2. Convert those visitors into leads via the form/phone CTA
 * 3. Build authority that helps OTHER articles rank too
 */

import {
  agentLLM,
  startRun,
  completeRun,
  sendMessage,
  createAction,
  getUnreadMessages,
  markMessageActedOn,
  type AgentThinkResult,
} from "./engine";
import {
  getTodaysGoals,
  recordOutcome,
  getAllMemory,
  getLessons,
  formatLessonsForContext,
  formatGoalsForContext,
  setMemory,
  addLesson,
} from "./agentGoalEngine";
import { getDb } from "../db";
import { contentPipeline, blogPosts, blogDrafts } from "../../drizzle/schema";
import { desc, eq, and, ne } from "drizzle-orm";

const SYSTEM_PROMPT = `You are the Content Agent for Solar Freedom (breakyoursolarcontract.com). CITY PAGES FOR INTERNAL LINKING (ALLOWLIST ONLY): phoenix-az houston-tx dallas-tx austin-tx san-antonio-tx los-angeles-ca san-diego-ca las-vegas-nv denver-co miami-fl HARD RULE: never contentType city_page; never invent Jacksonville/Tampa/Orlando; never restore ~276 thin cities. MONEY HUBS: /free-cancellation-letter /calculator /compare /solar-contract-laws/texas /solar-contract-laws/california /solar-contract-laws/arizona`;

export function assessDraftReadiness(draft?: string): { passed: boolean; issues: string[] } {
  const text = (draft || "").trim();
  if (!text) return { passed: false, issues: ["No full draft was supplied."] };
  const words = text.split(/\s+/).filter(Boolean).length;
  const issues = [
    ...(words < 1600 ? [`Draft is incomplete at ${words} words; minimum pre-editor length is 1,600 words.`] : []),
    ...(!/[.!?]["')\]]?$/.test(text) ? ["Draft appears truncated because it does not end with a complete sentence."] : []),
    ...(!/\b(faq|frequently asked questions)\b/i.test(text) ? ["Draft is missing a visible FAQ section."] : []),
    ...(!/\b(case review|15[- ]minute|20[- ]minute)\b/i.test(text) ? ["Draft is missing the required no-obligation case-review CTA."] : []),
  ];
  return { passed: issues.length === 0, issues };
}
