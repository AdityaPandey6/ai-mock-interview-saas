import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // 🔥 HANDLE PREFLIGHT REQUEST
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ error: "Invalid file payload" }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    const formDataGroq = new FormData();

    // Convert incoming file into a clean blob for Groq multipart upload.
    const fileBuffer = await file.arrayBuffer();
    const blob = new Blob([fileBuffer], { type: "audio/webm" });

    formDataGroq.append("file", blob, "audio.webm");
    formDataGroq.append("model", "whisper-large-v3-turbo");

    const groqRes = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("GROQ_API_KEY")}`,
        },
        body: formDataGroq,
      },
    );

    const rawText = await groqRes.text();
    console.log("RAW GROQ RESPONSE:", rawText);

    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = {};
    }

    if (!groqRes.ok) {
      return new Response(
        JSON.stringify({
          error: "Groq transcription request failed",
          status: groqRes.status,
          details: data,
        }),
        {
          status: 502,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    return new Response(JSON.stringify({ text: data.text || "" }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});
