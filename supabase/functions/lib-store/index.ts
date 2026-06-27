import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface LibStoreRequest {
  problem_family: string;
  solution: string;
  source: string;
  confidence: number;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: LibStoreRequest = await req.json();

    const { problem_family, solution, source, confidence } = body;

    if (!problem_family || typeof problem_family !== "string") {
      return new Response(
        JSON.stringify({ error: "problem_family is required and must be a string" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!solution || typeof solution !== "string") {
      return new Response(
        JSON.stringify({ error: "solution is required and must be a string" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!source || typeof source !== "string") {
      return new Response(
        JSON.stringify({ error: "source is required and must be a string" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (confidence === undefined || typeof confidence !== "number" || confidence < 0 || confidence > 1) {
      return new Response(
        JSON.stringify({ error: "confidence is required and must be a number between 0 and 1" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data, error } = await supabase.rpc("upsert_knowledge_library", {
      p_problem_family: problem_family,
      p_solution: solution,
      p_source: source,
      p_confidence: confidence,
    });

    if (error) {
      const { data: upsertData, error: upsertError } = await supabase
        .from("knowledge_library")
        .upsert(
          {
            problem_family,
            solution,
            source,
            confidence,
            occurrence_count: 1,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "problem_family",
            ignoreDuplicates: false,
          }
        )
        .select()
        .single();

      if (upsertError) {
        const { data: existingData, error: selectError } = await supabase
          .from("knowledge_library")
          .select("*")
          .eq("problem_family", problem_family)
          .single();

        if (selectError || !existingData) {
          const { data: insertData, error: insertError } = await supabase
            .from("knowledge_library")
            .insert({
              problem_family,
              solution,
              source,
              confidence,
              occurrence_count: 1,
            })
            .select()
            .single();

          if (insertError) {
            throw insertError;
          }

          return new Response(
            JSON.stringify({
              success: true,
              data: insertData,
              action: "inserted",
            }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const { data: updateData, error: updateError } = await supabase
          .from("knowledge_library")
          .update({
            solution,
            source,
            confidence,
            occurrence_count: (existingData.occurrence_count || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("problem_family", problem_family)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        return new Response(
          JSON.stringify({
            success: true,
            data: updateData,
            action: "updated",
            occurrence_count: updateData.occurrence_count,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: upsertData,
          action: "upserted",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data,
        action: "upserted_via_rpc",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
    console.error("lib-store error:", errorMessage);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});