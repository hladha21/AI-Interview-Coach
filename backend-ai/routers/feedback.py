import json
import re
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict
from services.llm_client import call_llm

router = APIRouter()


class FeedbackRequest(BaseModel):
    role: str
    difficulty: str
    question: str
    answer: str


class FeedbackResponse(BaseModel):
    scores: Dict[str, float]
    summary: str
    strengths: List[str]
    improvements: List[str]


SYSTEM_PROMPT = """You are a strict and honest technical interviewer at a top tech company.
You must evaluate interview answers critically and fairly.
Your scores must reflect the actual quality of the answer:
- A one word answer like "NO" or "yes" = score 1-2
- A vague answer with no details = score 3-4
- A basic answer with some correct points = score 5-6
- A good answer with clear explanation = score 7-8
- An excellent answer with examples and depth = score 9-10

You MUST respond with ONLY a valid JSON object. No markdown, no explanation, no text before or after the JSON."""


@router.post("/feedback", response_model=FeedbackResponse)
async def get_feedback(req: FeedbackRequest):
    answer_length = len(req.answer.strip().split())

    user_message = f"""Evaluate this interview answer strictly and honestly.

Role: {req.role}
Difficulty: {req.difficulty}
Question: {req.question}
Candidate's answer: {req.answer}

The answer has {answer_length} words.

Scoring rules:
- Less than 10 words = clarity 1-3, depth 1-2
- 10-30 words = clarity 3-5, depth 2-4
- 31-80 words = clarity 5-7, depth 4-6
- 81-150 words = clarity 6-8, depth 5-7
- 150+ words with good content = clarity 7-9, depth 6-9

Give specific feedback about THIS answer. Mention specific things the candidate said or didn't say.

Respond with ONLY this JSON (replace all values):
{{
  "scores": {{
    "clarity": <integer 1-10>,
    "depth": <integer 1-10>,
    "relevance": <integer 1-10>,
    "confidence": <integer 1-10>
  }},
  "summary": "<2-3 sentences evaluating this specific answer>",
  "strengths": ["<specific strength from this answer>", "<another specific strength>"],
  "improvements": ["<specific thing missing from this answer>", "<another specific improvement>"]
}}"""

    try:
        raw = await call_llm(SYSTEM_PROMPT, user_message)
        print(f">>> RAW RESPONSE: {raw[:600]}")

        raw = raw.strip()
        raw = re.sub(r"```json|```", "", raw).strip()

        # Strategy 1: direct parse
        data = None
        try:
            data = json.loads(raw)
        except Exception:
            pass

        # Strategy 2: find JSON object
        if not data:
            try:
                match = re.search(r'\{[\s\S]*\}', raw)
                if match:
                    data = json.loads(match.group())
            except Exception:
                pass

        # Strategy 3: extract individual scores with regex
        if not data:
            try:
                scores = {}
                for field in ["clarity", "depth", "relevance", "confidence"]:
                    m = re.search(rf'"{field}"\s*:\s*(\d+(?:\.\d+)?)', raw)
                    if m:
                        scores[field] = float(m.group(1))

                summary_m = re.search(r'"summary"\s*:\s*"([^"]+)"', raw)
                strengths_m = re.findall(r'"([^"]{10,})"', raw)

                if len(scores) == 4:
                    data = {
                        "scores": scores,
                        "summary": summary_m.group(1) if summary_m else "Answer evaluated.",
                        "strengths": ["Good attempt at answering"],
                        "improvements": ["Provide more specific details"]
                    }
            except Exception:
                pass

        # Validate and clean scores
        if data and "scores" in data:
            score_fields = ["clarity", "depth", "relevance", "confidence"]
            for field in score_fields:
                if field not in data["scores"]:
                    data["scores"][field] = 5.0
                val = float(data["scores"][field])
                # Clamp between 1 and 10
                data["scores"][field] = max(1.0, min(10.0, val))

            if not data.get("strengths") or len(data["strengths"]) == 0:
                data["strengths"] = ["Attempted to answer the question"]
            if not data.get("improvements") or len(data["improvements"]) == 0:
                data["improvements"] = ["Add more specific details and examples"]
            if not data.get("summary"):
                data["summary"] = "The answer was evaluated based on content."

            print(f">>> FINAL SCORES: {data['scores']}")
            return FeedbackResponse(**data)

    except Exception as e:
        print(f">>> ERROR: {e}")

    # Last resort fallback based on word count
    words = answer_length
    if words < 10:
        scores = {"clarity": 2.0, "depth": 1.0, "relevance": 2.0, "confidence": 1.5}
        summary = "The answer is too short. A proper interview answer needs at least 3-4 sentences with clear explanation."
        strengths = ["Attempted to respond to the question"]
        improvements = ["Write a much more detailed answer", "Explain your reasoning step by step"]
    elif words < 30:
        scores = {"clarity": 4.0, "depth": 3.0, "relevance": 4.0, "confidence": 3.0}
        summary = "The answer is too brief. More detail and examples are needed to demonstrate understanding."
        strengths = ["Basic understanding shown", "Relevant response"]
        improvements = ["Expand your answer significantly", "Add concrete examples from your experience"]
    elif words < 80:
        scores = {"clarity": 5.5, "depth": 4.5, "relevance": 5.5, "confidence": 5.0}
        summary = "The answer covers the basics but lacks depth. A stronger answer would include specific examples and deeper explanation."
        strengths = ["Covers the key concepts", "Clear structure"]
        improvements = ["Add more technical depth", "Include a real-world example"]
    else:
        scores = {"clarity": 7.0, "depth": 6.5, "relevance": 7.0, "confidence": 6.5}
        summary = "Good detailed answer. Shows solid understanding of the topic with reasonable depth."
        strengths = ["Detailed and well-structured answer", "Good coverage of the topic"]
        improvements = ["Add edge cases or tradeoffs", "Mention specific tools or technologies"]

    return FeedbackResponse(
        scores=scores,
        summary=summary,
        strengths=strengths,
        improvements=improvements
    )