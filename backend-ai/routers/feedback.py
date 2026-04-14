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


SYSTEM_PROMPT = """You are an extremely strict senior technical interviewer at Google or Meta.
You have zero tolerance for vague, incomplete, or irrelevant answers.
You must be brutally honest. Your job is to help candidates improve, not to make them feel good.

Strict scoring rules — follow these EXACTLY:
- Irrelevant answer / "I don't know" / gibberish = ALL scores 0
- 1-5 words with no substance = ALL scores 0
- Vague answer with no technical content = scores 1-3
- Very basic answer missing key concepts = scores 3-5
- Decent answer with some gaps = scores 5-6
- Good answer covering main points = scores 6-7
- Very good answer with examples = scores 7-8
- Excellent comprehensive answer = scores 8-9
- Perfect answer with depth, examples, tradeoffs = scores 9-10

Strengths rules:
- Score below 4 = strengths MUST be empty []
- Score 4-6 = maximum 1 strength
- Score 7+ = maximum 2 strengths
- NEVER invent strengths. Only mention what is actually in the answer.

Respond with ONLY valid JSON. Absolutely no text before or after."""


IRRELEVANT_ANSWERS = [
    "no", "yes", "idk", "i don't know", "i dont know", "don't know",
    "dont know", "nothing", "none", "maybe", "ok", "okay", "hmm",
    "hi", "hello", "i have no idea", "no idea", "not sure", "unsure",
    "i am not sure", "i'm not sure", "i do not know", "dunno",
    "nope", "yep", "yeah", "nah", "pass", "skip", "next",
    "i don't know the answer", "i dont know the answer",
    "i have no clue", "no clue", "clueless", "blank", "empty"
]


def _is_irrelevant(answer: str) -> bool:
    stripped = answer.strip().lower()
    words = stripped.split()

    # Empty or single character
    if len(stripped) <= 2:
        return True

    # Matches known irrelevant phrases
    if stripped in IRRELEVANT_ANSWERS:
        return True

    # Less than 4 words
    if len(words) < 4:
        return True

    # Check if answer starts with "i don't know" or similar
    for phrase in ["i don't know", "i dont know", "i do not know",
                   "i have no idea", "i'm not sure", "i am not sure"]:
        if stripped.startswith(phrase):
            return True

    return False


@router.post("/feedback", response_model=FeedbackResponse)
async def get_feedback(req: FeedbackRequest):
    answer_words = len(req.answer.strip().split())
    answer_stripped = req.answer.strip()
    is_irrelevant = _is_irrelevant(answer_stripped)

    # Immediately return 0 scores for irrelevant answers
    if is_irrelevant:
        return FeedbackResponse(
            scores={"clarity": 0.0, "depth": 0.0, "relevance": 0.0, "confidence": 0.0},
            summary=(
                f"This is not an acceptable interview answer. Writing '{answer_stripped}' "
                f"demonstrates no knowledge or effort. In a real interview, this response "
                f"would immediately disqualify you. You must attempt to answer every question "
                f"with technical detail and reasoning, even if you are not 100% sure."
            ),
            strengths=[],
            improvements=[
                "Never say 'I don't know' in an interview — always attempt an answer",
                "Study the core concepts related to this topic before your interview",
                "Write at least 4-5 sentences explaining your understanding",
                "If unsure, explain what you do know and reason through the rest"
            ]
        )

    user_message = f"""You are evaluating an interview answer. Be extremely strict and honest.

Role: {req.role}
Difficulty: {req.difficulty}
Question: {req.question}
Candidate answer: {answer_stripped}
Word count: {answer_words} words

Evaluate strictly:
1. Does the answer actually address the question? If not, all scores = 0
2. Is there real technical content? If no, scores max 3
3. Are there specific details and examples? If no, scores max 6
4. Is the answer comprehensive and correct? Only then scores 7+

Strengths = [] if average score below 4.
Only mention strengths that are EXPLICITLY present in the answer.
Improvements must be SPECIFIC to what is missing from THIS answer.

Respond with ONLY this JSON:
{{
  "scores": {{
    "clarity": <0-10>,
    "depth": <0-10>,
    "relevance": <0-10>,
    "confidence": <0-10>
  }},
  "summary": "<2-3 sentences specifically about this answer, be direct and honest>",
  "strengths": [<empty array [] if score below 4, otherwise specific strengths only>],
  "improvements": ["<specific thing missing from this answer>", "<another specific gap>"]
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
                        "improvements": [
                            "Provide more specific details",
                            "Include technical examples"
                        ]
                    }
            except Exception:
                pass

        if data and "scores" in data:
            # Clamp scores 0-10
            for field in ["clarity", "depth", "relevance", "confidence"]:
                if field not in data["scores"]:
                    data["scores"][field] = 2.0
                data["scores"][field] = max(0.0, min(10.0, float(data["scores"][field])))

            avg_score = sum(data["scores"].values()) / 4

            # Force empty strengths for low scores
            if avg_score < 4.0:
                data["strengths"] = []
            elif avg_score < 7.0 and len(data.get("strengths", [])) > 1:
                data["strengths"] = data["strengths"][:1]

            # Ensure improvements always exist
            if not data.get("improvements") or len(data["improvements"]) == 0:
                data["improvements"] = [
                    "Provide a more detailed technical explanation",
                    "Include specific real-world examples"
                ]

            if not data.get("summary"):
                data["summary"] = "The answer requires significant improvement."

            print(f">>> SCORES: {data['scores']}, AVG: {avg_score:.1f}")
            return FeedbackResponse(**data)

    except Exception as e:
        print(f">>> ERROR: {e}")

    # Strict fallback based on word count
    if answer_words < 20:
        return FeedbackResponse(
            scores={"clarity": 1.0, "depth": 0.5, "relevance": 1.0, "confidence": 0.5},
            summary="This answer is far too short. No meaningful evaluation is possible. A proper interview answer requires detailed explanation with technical content.",
            strengths=[],
            improvements=[
                "Write at least 5-6 sentences minimum",
                "Explain the core concept with technical accuracy",
                "Add a real-world example to demonstrate understanding",
                "Show your thought process and reasoning clearly"
            ]
        )
    elif answer_words < 50:
        return FeedbackResponse(
            scores={"clarity": 3.0, "depth": 2.0, "relevance": 3.0, "confidence": 2.5},
            summary="The answer is too brief and lacks technical depth. This would not pass an interview at a top company.",
            strengths=[],
            improvements=[
                "Significantly expand your answer with technical details",
                "Add a concrete real-world example",
                "Explain the underlying concepts more thoroughly",
                "Mention potential tradeoffs or edge cases"
            ]
        )
    elif answer_words < 100:
        return FeedbackResponse(
            scores={"clarity": 5.0, "depth": 4.0, "relevance": 5.0, "confidence": 4.5},
            summary="The answer covers the basics but lacks depth and specifics needed to impress in a real interview.",
            strengths=[],
            improvements=[
                "Add more technical depth and precision",
                "Include a specific real-world example",
                "Mention edge cases or tradeoffs"
            ]
        )
    else:
        return FeedbackResponse(
            scores={"clarity": 6.5, "depth": 6.0, "relevance": 6.5, "confidence": 6.0},
            summary="Decent answer with reasonable length. Needs more specific examples and deeper technical insight to score higher.",
            strengths=["Shows effort with a detailed response"],
            improvements=[
                "Add specific examples from real experience",
                "Discuss tradeoffs and edge cases",
                "Be more precise with technical terminology"
            ]
        )