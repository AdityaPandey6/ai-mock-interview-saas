import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { buildEvaluationPrompt } from "../../../src/ai/prompt.ts";

/* -------------------- CORS -------------------- */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/* -------------------- ENV -------------------- */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")!;

/* -------------------- CLIENTS -------------------- */

// Auth verification client
const supabaseAuth = createClient(SUPABASE_URL, ANON_KEY);

// Admin DB client
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

/* -------------------- SERVER -------------------- */

serve(async (req) => {

  /* ---------- Preflight ---------- */

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {

    console.log("=== Evaluation Request Started ===");

    /* ---------- AUTH ---------- */

    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization token" }),
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      console.error("JWT verification failed:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: corsHeaders }
      );
    }

    const userId = user.id;
    console.log("Authenticated user:", userId);

    /* ---------- REQUEST BODY ---------- */

    const { session_id, question_id, user_answer } = await req.json();

    if (!session_id || !question_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const safeAnswer = user_answer?.trim() || "No answer provided";

    /* ---------- SESSION VALIDATION ---------- */

    const { data: sessionData, error: sessionError } =
      await supabaseAdmin
        .from("mock_sessions")
        .select("user_id, total_score")
        .eq("id", session_id)
        .single();

    if (sessionError || !sessionData) {
      return new Response(
        JSON.stringify({ error: "Session not found" }),
        { status: 404, headers: corsHeaders }
      );
    }

    if (sessionData.user_id !== userId) {
      return new Response(
        JSON.stringify({ error: "Forbidden session access" }),
        { status: 403, headers: corsHeaders }
      );
    }

    console.log("Session validated");

    /* ---------- QUESTION FETCH ---------- */

    const { data: questionData, error: questionError } =
      await supabaseAdmin
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

    /* ---------- PROMPT ---------- */

    const prompt = buildEvaluationPrompt(
      question_text,
      ideal_answer,
      null,
      safeAnswer
    );

    /* ---------- LLM CALL ---------- */

    const groqRes = await fetch(
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

    const llmData = await groqRes.json();

    if (!llmData.choices || !llmData.choices.length) {
      console.error("Invalid LLM response:", llmData);
      return new Response(
        JSON.stringify({ error: "LLM evaluation failed" }),
        { status: 500, headers: corsHeaders }
      );
    }

    const rawOutput = llmData.choices[0].message.content;

    /* ---------- JSON PARSE ---------- */

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

    /* ---------- SCORING ---------- */

    const concept = Number(parsed.concept_accuracy) || 0;
    const clarity = Number(parsed.clarity) || 0;
    const example = Number(parsed.example_usage) || 0;
    const edge = Number(parsed.edge_cases) || 0;

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

    const normalized = Math.min(rawScore, 1);
    const finalScore = Math.round(normalized * 10);

    console.log("Score computed:", finalScore);

    /* ---------- STORE ANSWER ---------- */

    const { error: insertError } =
      await supabaseAdmin.from("mock_answers").insert({
        session_id,
        question_id,
        user_answer: safeAnswer,
        llm_score: {
          concept_accuracy: concept,
          clarity,
          example_usage: example,
          edge_cases: edge,
        },
        final_score: finalScore,
        feedback:
          parsed.overall_feedback + "\n\nTips: " + parsed.improvement_tips,
      });

    if (insertError) {
      console.error("Insert failed:", insertError);
      throw insertError;
    }

    /* ---------- UPDATE SESSION SCORE ---------- */

    const newTotalScore =
      (sessionData.total_score || 0) + finalScore;

    const { error: updateError } =
      await supabaseAdmin
        .from("mock_sessions")
        .update({ total_score: newTotalScore })
        .eq("id", session_id);

    if (updateError) {
      console.error("Score update failed:", updateError);
      throw updateError;
    }

    console.log("Session score updated");

    /* ---------- RESPONSE ---------- */

    return new Response(
      JSON.stringify({
        score: finalScore,
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

    console.error("=== Evaluation Error ===", error);

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
