import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { buildEvaluationPrompt } from "../../../src/ai/prompt.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  // -------------------------------
  // Handle CORS Preflight
  // -------------------------------
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // -------------------------------
    // Parse Request Body
    // -------------------------------
    const { session_id, question_id, user_answer } = await req.json();

    if (!session_id || !question_id || !user_answer) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // -------------------------------
    // Fetch Question
    // -------------------------------
    const { data: questionData, error: questionError } = await supabase
      .from("questions")
      .select("*")
      .eq("id", question_id)
      .single();

    if (questionError || !questionData) {
      return new Response(
        JSON.stringify({ error: "Question not found" }),
        { status: 404, headers: corsHeaders }
      );
    }

    const { question_text, ideal_answer, rubric } = questionData;

    // -------------------------------
    // Build Prompt
    // -------------------------------
    const prompt = buildEvaluationPrompt(
      question_text,
      ideal_answer,
      null,
      user_answer
    );

    // -------------------------------
    // Call GROQ
    // -------------------------------
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          temperature: 0.2,
          max_tokens: 500,
          messages: [
            {
              role: "system",
              content: "You are a strict technical interviewer.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!data.choices || !data.choices.length) {
      return new Response(
        JSON.stringify({
          error: "Invalid LLM response",
          details: data,
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    const rawOutput = data.choices[0].message.content;

    // -------------------------------
    // Parse JSON Safely
    // -------------------------------
    let parsed;
    try {
      parsed = JSON.parse(rawOutput);
    } catch {
      return new Response(
        JSON.stringify({
          error: "LLM returned invalid JSON",
          raw: rawOutput,
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    // -------------------------------
    // Normalize Scores
    // -------------------------------
    const concept = Number(parsed.concept_accuracy) || 0;
    const clarity = Number(parsed.clarity) || 0;
    const example = Number(parsed.example_usage) || 0;
    const edge = Number(parsed.edge_cases) || 0;

    // -------------------------------
    // Weighted Backend Scoring
    // -------------------------------
    const weights = {
      concept_accuracy: rubric?.concept_accuracy ?? 0.4,
      clarity: rubric?.clarity ?? 0.3,
      example_usage: rubric?.example_usage ?? 0.2,
      edge_cases: rubric?.edge_cases ?? 0.1,
    };

    const rawScore =
      concept * weights.concept_accuracy +
      clarity * weights.clarity +
      example * weights.example_usage +
      edge * weights.edge_cases;

    const normalizedRaw = Math.min(rawScore, 1);
    const finalScore = Math.round(normalizedRaw * 10);
    const safeFinalScore = Number.isFinite(finalScore) ? finalScore : 0;

    // -------------------------------
    // Store Attempt
    // -------------------------------
    await supabase.from("attempts").insert({
      session_id,
      question_id,
      user_answer,
      llm_score: {
        concept_accuracy: concept,
        clarity,
        example_usage: example,
        edge_cases: edge,
      },
      final_score: safeFinalScore,
      feedback:
        parsed.overall_feedback + "\n\nTips: " + parsed.improvement_tips,
    });

    // -------------------------------
    // Update Session Score
    // -------------------------------
    const { data: scores } = await supabase
      .from("attempts")
      .select("final_score")
      .eq("session_id", session_id);

    const totalScore =
      scores?.reduce((sum, row) => sum + row.final_score, 0) || 0;

    await supabase
      .from("mock_sessions")
      .update({ total_score: totalScore })
      .eq("id", session_id);

    // -------------------------------
    // Success Response
    // -------------------------------
    return new Response(
      JSON.stringify({
        score: safeFinalScore,
        feedback: parsed.overall_feedback,
        tips: parsed.improvement_tips,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
