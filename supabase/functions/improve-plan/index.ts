import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TaskExecution {
  id: string;
  task_type: string;
  error_message: string | null;
  error_code: string | null;
  status: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

interface FailurePattern {
  task_type: string;
  pattern: string;
  count: number;
  examples: string[];
}

function extractErrorPattern(errorMessage: string | null): string {
  if (!errorMessage) return "unknown_error";
  
  const normalizedError = errorMessage.toLowerCase().trim();
  
  if (normalizedError.includes("timeout")) return "timeout_error";
  if (normalizedError.includes("connection") || normalizedError.includes("network")) return "connection_error";
  if (normalizedError.includes("permission") || normalizedError.includes("unauthorized") || normalizedError.includes("forbidden")) return "permission_error";
  if (normalizedError.includes("not found") || normalizedError.includes("404")) return "not_found_error";
  if (normalizedError.includes("validation") || normalizedError.includes("invalid")) return "validation_error";
  if (normalizedError.includes("rate limit") || normalizedError.includes("too many requests")) return "rate_limit_error";
  if (normalizedError.includes("memory") || normalizedError.includes("out of memory")) return "memory_error";
  if (normalizedError.includes("syntax") || normalizedError.includes("parse")) return "syntax_error";
  if (normalizedError.includes("null") || normalizedError.includes("undefined")) return "null_reference_error";
  if (normalizedError.includes("duplicate") || normalizedError.includes("already exists")) return "duplicate_error";
  
  const words = normalizedError.split(/\s+/).slice(0, 3).join("_");
  return words.replace(/[^a-z0-9_]/g, "").substring(0, 50) || "generic_error";
}

function generatePlanText(pattern: FailurePattern): string {
  const { task_type, pattern: errorPattern, count, examples } = pattern;
  
  const fixes: Record<string, string> = {
    timeout_error: `Implement exponential backoff retry mechanism. Increase timeout thresholds. Add circuit breaker pattern to prevent cascading failures. Consider breaking down large operations into smaller chunks.`,
    connection_error: `Add connection pooling and retry logic with jitter. Implement health checks before critical operations. Add fallback mechanisms for external service dependencies.`,
    permission_error: `Review and update access control policies. Implement proper token refresh mechanisms. Add permission validation before executing sensitive operations.`,
    not_found_error: `Add existence checks before operations. Implement graceful handling for missing resources. Add data validation at input boundaries.`,
    validation_error: `Strengthen input validation schemas. Add detailed error messages for validation failures. Implement client-side pre-validation where possible.`,
    rate_limit_error: `Implement request throttling and queuing. Add rate limit tracking and backoff. Consider caching frequently accessed data to reduce API calls.`,
    memory_error: `Implement streaming for large data processing. Add memory usage monitoring. Optimize data structures and implement pagination for large datasets.`,
    syntax_error: `Add comprehensive input sanitization. Implement schema validation for structured data. Add linting and pre-execution validation steps.`,
    null_reference_error: `Add null checks and optional chaining. Implement default values for optional parameters. Add comprehensive error boundaries.`,
    duplicate_error: `Implement idempotency keys for operations. Add upsert logic where appropriate. Implement conflict resolution strategies.`,
    unknown_error: `Add comprehensive logging and error tracking. Implement structured error handling. Review error messages for better categorization.`,
    generic_error: `Analyze specific error patterns in logs. Implement more granular error categorization. Add monitoring alerts for recurring issues.`
  };

  const specificFix = fixes[errorPattern] || fixes.generic_error;
  
  return `## Improvement Plan for ${task_type} - ${errorPattern}

### Issue Summary
- **Task Type**: ${task_type}
- **Error Pattern**: ${errorPattern}
- **Occurrence Count**: ${count} failures in last 50 failed executions

### Sample Error Messages
${examples.slice(0, 3).map((ex, i) => `${i + 1}. ${ex}`).join("\n")}

### Recommended Fix
${specificFix}

### Implementation Steps
1. Identify all code paths in ${task_type} that could trigger ${errorPattern}
2. Add proper error handling and logging at each identified point
3. Implement the recommended fix strategy
4. Add unit tests covering the failure scenarios
5. Deploy with feature flag for gradual rollout
6. Monitor error rates post-deployment

### Success Criteria
- Reduce ${errorPattern} occurrences in ${task_type} by at least 80%
- Improve overall ${task_type} success rate
- No increase in other error types`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: failedTasks, error: fetchError } = await supabase
      .from("task_executions")
      .select("id, task_type, error_message, error_code, status, created_at, metadata")
      .eq("status", "failed")
      .order("created_at", { ascending: false })
      .limit(50);

    if (fetchError) {
      throw new Error(`Failed to fetch task executions: ${fetchError.message}`);
    }

    if (!failedTasks || failedTasks.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No failed tasks found", plans_created: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const patternMap = new Map<string, FailurePattern>();

    for (const task of failedTasks as TaskExecution[]) {
      const errorPattern = extractErrorPattern(task.error_message);
      const key = `${task.task_type}::${errorPattern}`;

      if (patternMap.has(key)) {
        const existing = patternMap.get(key)!;
        existing.count++;
        if (task.error_message && existing.examples.length < 5) {
          existing.examples.push(task.error_message);
        }
      } else {
        patternMap.set(key, {
          task_type: task.task_type,
          pattern: errorPattern,
          count: 1,
          examples: task.error_message ? [task.error_message] : []
        });
      }
    }

    const sortedPatterns = Array.from(patternMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    const improvementPlans = sortedPatterns.map(pattern => ({
      task_type: pattern.task_type,
      error_pattern: pattern.pattern,
      occurrence_count: pattern.count,
      plan_text: generatePlanText(pattern),
      status: "pending",
      created_at: new Date().toISOString(),
      metadata: {
        sample_errors: pattern.examples.slice(0, 3),
        analysis_date: new Date().toISOString(),
        total_failures_analyzed: failedTasks.length
      }
    }));

    const { data: insertedPlans, error: insertError } = await supabase
      .from("improvement_plans")
      .insert(improvementPlans)
      .select();

    if (insertError) {
      throw new Error(`Failed to insert improvement plans: ${insertError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Created ${improvementPlans.length} improvement plans`,
        plans_created: improvementPlans.length,
        patterns_analyzed: sortedPatterns.map(p => ({
          task_type: p.task_type,
          pattern: p.pattern,
          count: p.count
        })),
        plan_ids: insertedPlans?.map(p => p.id) || []
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Error in improve-plan function:", errorMessage);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});