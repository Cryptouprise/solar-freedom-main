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
