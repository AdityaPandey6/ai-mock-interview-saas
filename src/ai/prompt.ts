type Rubric = {
  concept_accuracy: string;
  example_usage: string;
  edge_cases: string;
  clarity: string;
};

export function buildEvaluationPrompt(
  question: string,
  idealAnswer: string,
  rubric: Rubric,
  userAnswer: string,
) {
  return `
You are a senior technical interviewer.

Evaluate the candidate answer strictly based on the rubric.

Rubric:
${JSON.stringify(rubric, null, 2)}

Scoring Guidelines:
0.0 - Completely incorrect or irrelevant
0.3 - Partial understanding with major gaps
0.5 - Average answer, missing depth
0.7 - Good answer with minor gaps
1.0 - Excellent and complete

Rules:
- Only evaluate based on the candidate answer
- Do NOT assume missing information
- Do NOT infer unstated knowledge
- Be strict and realistic

Question:
${question}

Ideal Answer (reference only):
${idealAnswer}

Candidate Answer:
${userAnswer}

Return ONLY raw JSON.
Do NOT include markdown or explanation.
The response must start with { and end with }.

{
  "concept_accuracy": number,
  "example_usage": number,
  "edge_cases": number,
  "clarity": number,
  "overall_feedback": string,
  "improvement_tips": string
}
`;
}
