import os
import json
import random
import requests


async def call_llm(system_prompt: str, user_message: str) -> str:
    provider = os.getenv("LLM_PROVIDER", "mock")
    print(f">>> PROVIDER: {provider}")

    if provider == "openrouter":
        return _call_openrouter(system_prompt, user_message)
    elif provider == "anthropic":
        return await _call_anthropic(system_prompt, user_message)
    elif provider == "openai":
        return await _call_openai(system_prompt, user_message)
    else:
        return _mock_response(user_message)


def _call_openrouter(system: str, user: str) -> str:
    api_key = os.getenv("OPENROUTER_API_KEY")
    print(f">>> API KEY EXISTS: {bool(api_key)}")

    if not api_key:
        raise Exception("OPENROUTER_API_KEY not set in .env")

    combined = f"{system}\n\n{user}"

    try:
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000",
                "X-OpenRouter-Title": "AI Interview Coach",
            },
            json={
                "model": "google/gemma-3-4b-it:free",
                "messages": [
                    {"role": "user", "content": combined}
                ]
            },
            timeout=30
        )
        print(f">>> OPENROUTER STATUS: {response.status_code}")
        data = response.json()
        print(f">>> OPENROUTER RESPONSE: {str(data)[:300]}")

        if response.status_code != 200:
            raise Exception(f"OpenRouter error: {data}")

        return data["choices"][0]["message"]["content"]

    except Exception as e:
        print(f">>> OPENROUTER FAILED: {e}")
        raise


async def _call_anthropic(system: str, user: str) -> str:
    import anthropic
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise Exception("ANTHROPIC_API_KEY not set in .env")
    client = anthropic.Anthropic(api_key=api_key)
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1500,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    return message.content[0].text


async def _call_openai(system: str, user: str) -> str:
    from openai import OpenAI
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    response = client.chat.completions.create(
        model="gpt-4o",
        max_tokens=1500,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    )
    return response.choices[0].message.content


def _mock_response(user_message: str) -> str:
    if "scores" in user_message.lower() or "evaluate" in user_message.lower() or "answer" in user_message.lower():
        clarity = round(random.uniform(6.0, 9.5), 1)
        depth = round(random.uniform(5.5, 9.0), 1)
        relevance = round(random.uniform(6.5, 9.5), 1)
        confidence = round(random.uniform(5.0, 9.0), 1)
        return json.dumps({
            "scores": {
                "clarity": clarity,
                "depth": depth,
                "relevance": relevance,
                "confidence": confidence
            },
            "summary": "Your answer demonstrated a solid understanding of the core concept. You structured your response well and covered the main points clearly. With a bit more depth and concrete examples, this would be an excellent answer.",
            "strengths": [
                "Clear and logical structure throughout the answer",
                "Good use of relevant terminology and concepts"
            ],
            "improvements": [
                "Add a concrete real-world example to strengthen your explanation",
                "Go deeper on the underlying mechanics"
            ]
        })

    if "questions" in user_message.lower() or "generate" in user_message.lower():
        return json.dumps({
            "questions": [
                "Can you walk me through how you would design a scalable REST API from scratch?",
                "Explain the difference between SQL and NoSQL databases. When would you choose one over the other?",
                "What is the event loop in JavaScript and how does it handle asynchronous operations?",
                "Describe a challenging bug you encountered in a past project and how you resolved it.",
                "How would you optimize a slow database query? Walk me through your thought process.",
                "What are the SOLID principles? Can you give an example of one in your own code?",
                "Explain how you would implement authentication and authorization in a web application.",
                "Tell me about a time you had a disagreement with a teammate. How did you handle it?"
            ]
        })

    return json.dumps({"message": "Mock response"})