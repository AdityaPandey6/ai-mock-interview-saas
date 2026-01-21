export function buildEvaluationPrompt(
  question: string,
  idealAnswer: string,
  rubric: any,
  userAnswer: string
) {
  return `
You are a senior technical interviewer.

Evaluate the candidate answer semantically.

Question:
${question}

Ideal Answer (reference only):
${idealAnswer}

Candidate Answer:
${userAnswer}

Return ONLY valid JSON in this exact format:

{
  "concept_accuracy": number,
  "example_usage": number,
  "edge_cases": number,
  "clarity": number,
  "overall_feedback": string,
  "improvement_tips": string
}

Rules:
- concept_accuracy, example_usage, edge_cases, clarity must be numbers between 0 and 1
- These values represent raw evaluation quality, NOT final score
- Do NOT apply any weighting
- Do NOT normalize
- Do NOT calculate final score
- Be strict and realistic
- Poor answers should receive low values (below 0.4)
- Excellent answers can receive high values (above 0.8)
- Return only JSON
- Do NOT add markdown
`;
}
