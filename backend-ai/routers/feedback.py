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
Evaluate interview answers critically and fairly.

Scoring guide:
- 1 word or irrelevant answer = all scores 1-2, NO strengths
- Vague answer with no details = scores 3-4, NO strengths
- Basic answer with some correct points = scores 5-6, 1 strength max
- Good answer with clear explanation = scores 7-8, 2 strengths
- Excellent answer with examples and depth = scores 9-10, 2-3 strengths

If the answer is poor, irrelevant, or too short — the strengths list MUST be empty [].
Never give fake encouragement for bad answers.

Respond with ONLY valid JSON. No markdown, no text before or after."""


def _is_poor_answer(answer: str) -> bool:
    """Check if answer is too short or clearly irrelevant."""
    stripped = answer.strip()
    words = stripped.split()
    # Less than 5 words is definitely poor
    if len(words) < 5:
        return True
    # Common one-word irrelevant answers
    poor_answers = ["no", "yes", "idk", "i don't know", "dont know",
                    "nothing", "none", "maybe", "ok", "okay", "hmm", "hi", "hello"]
    if stripped.lower() in poor_answers:
        return True
    return False


@router.post("/feedback", response_model=FeedbackResponse)
async def get_feedback(req: FeedbackRequest):
    answer_words = len(req.answer.strip().split())
    is_poor = _is_poor_answer(req.answer)

    # Immediately return harsh feedback for clearly poor answers
    if is_poor:
        return FeedbackResponse(
            scores={"clarity": 1.0, "depth": 1.0, "relevance": 1.0, "confidence": 1.0},
            summary=(
                f"This answer does not address the question at all. "
                f"A proper interview answer requires a detailed explanation "
                f"with technical depth, examples, and clear reasoning. "
                f"Simply writing '{req.answer.strip()}' shows no understanding of the topic."
            ),
            strengths=[],
            improvements=[
                "Write a complete answer of at least 4-5 sentences",
                "Explain the concept clearly with technical details",
                "Include a real-world example to demonstrate understanding",
                "Show your thought process and reasoning"
            ]
        )

    user_message = f"""Evaluate this interview answer strictly and honestly.

Role: {req.role}
Difficulty: {req.difficulty}
Question: {req.question}
Candidate's answer: {req.answer}
Word count: {answer_words} words

Rules:
- If the answer is vague or lacks detail: scores 3-5, strengths must be []
- If the answer is basic but correct: scores 5-6, max 1 strength
- If the answer is good with explanation: scores 7-8, 2 strengths
- If excellent with examples and depth: scores 9-10, 2-3 strengths
- Strengths must ONLY mention things actually present in the answer
- Improvements must mention specific things MISSING from the answer
- Never give strengths for poor or vague answers

Respond with ONLY this JSON:
{{
  "scores": {{
    "clarity": <integer 1-10>,
    "depth": <integer 1-10>,
    "relevance": <integer 1-10>,
    "confidence": <integer 1-10>
  }},
  "summary": "<2-3 sentences about this specific answer>",
  "strengths": [<empty if answer is poor, otherwise specific strengths>],
  "improvements": ["<specific thing missing>", "<another specific improvement>"]
}}"""

    try:
        raw = await call_llm(SYSTEM_PROMPT, user_message)
        print(f">>> RAW: {raw[:600]}")

        raw = raw.strip()
        raw = re.sub(r"```json|```", "", raw).strip()

        data = None

        # Strategy 1: direct parse
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

        # Strategy 3: regex extraction
        if not data:
            try:
                scores = {}
                for field in ["clarity", "depth", "relevance", "confidence"]:
                    m = re.search(rf'"{field}"\s*:\s*(\d+(?:\.\d+)?)', raw)
                    if m:
                        scores[field] = float(m.group(1))
                summary_m = re.search(r'"summary"\s*:\s*"([^"]+)"', raw)
                if len(scores) == 4:
                    data = {
                        "scores": scores,
                        "summary": summary_m.group(1) if summary_m else "Answer evaluated.",
                        "strengths": [],
                        "improvements": ["Provide more specific details", "Include examples"]
                    }
            except Exception:
                pass

        if data and "scores" in data:
            # Clamp scores
            for field in ["clarity", "depth", "relevance", "confidence"]:
                if field not in data["scores"]:
                    data["scores"][field] = 3.0
                data["scores"][field] = max(1.0, min(10.0, float(data["scores"][field])))

            avg_score = sum(data["scores"].values()) / 4

            # If average score is low, force empty strengths
            if avg_score < 5.0:
                data["strengths"] = []

            # Ensure improvements always exist
            if not data.get("improvements"):
                data["improvements"] = [
                    "Provide a more detailed explanation",
                    "Include specific examples"
                ]

            if not data.get("summary"):
                data["summary"] = "The answer needs significant improvement."

            print(f">>> SCORES: {data['scores']}, STRENGTHS: {data.get('strengths')}")
            return FeedbackResponse(**data)

    except Exception as e:
        print(f">>> ERROR: {e}")

    # Fallback based on word count
    if answer_words < 20:
        return FeedbackResponse(
            scores={"clarity": 2.0, "depth": 1.5, "relevance": 2.0, "confidence": 1.5},
            summary="The answer is far too short to evaluate properly. Interview answers need detailed explanation with technical depth.",
            strengths=[],
            improvements=[
                "Write at least 4-5 sentences",
                "Explain the concept with technical details",
                "Add a real-world example",
                "Show your thought process"
            ]
        )
    elif answer_words < 50:
        return FeedbackResponse(
            scores={"clarity": 4.0, "depth": 3.0, "relevance": 4.0, "confidence": 3.5},
            summary="The answer is too brief and lacks depth. More detail and examples are needed.",
            strengths=[],
            improvements=[
                "Expand your answer with more technical depth",
                "Add a concrete real-world example",
                "Explain the underlying concepts more clearly"
            ]
        )
    elif answer_words < 100:
        return FeedbackResponse(
            scores={"clarity": 5.5, "depth": 4.5, "relevance": 5.5, "confidence": 5.0},
            summary="The answer covers the basics but needs more depth and specific examples to stand out.",
            strengths=["Covers the fundamental concepts"],
            improvements=[
                "Add more technical depth",
                "Include a specific real-world example"
            ]
        )
    else:
        return FeedbackResponse(
            scores={"clarity": 7.0, "depth": 6.5, "relevance": 7.0, "confidence": 6.5},
            summary="Good detailed answer showing solid understanding. Could be improved with more specific examples.",
            strengths=["Detailed and well-structured", "Good coverage of the topic"],
            improvements=[
                "Mention specific tradeoffs or edge cases",
                "Add concrete examples from experience"
            ]
        )