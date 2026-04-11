import json
import re
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from services.llm_client import call_llm

router = APIRouter()


class QuestionRequest(BaseModel):
    role: str
    difficulty: str
    count: int = 8


class QuestionsResponse(BaseModel):
    questions: List[str]


SYSTEM_PROMPT = "You are a senior technical interviewer. Respond with ONLY valid JSON, no markdown, no extra text."


FALLBACK_QUESTIONS = {
    "Frontend Engineer": {
        "easy": [
            "What is the difference between HTML, CSS, and JavaScript?",
            "Explain what a CSS flexbox is and when you would use it.",
            "What is the DOM and how do you manipulate it?",
            "What is the difference between let, const, and var in JavaScript?",
            "Explain what responsive design means.",
            "What is a React component and what are props?",
            "What is the difference between == and === in JavaScript?",
            "How do you center an element in CSS?"
        ],
        "intermediate": [
            "Explain how React's reconciliation algorithm works.",
            "What is the difference between useEffect and useLayoutEffect?",
            "How does the JavaScript event loop work?",
            "Explain CSS specificity and how it affects styling.",
            "What is the virtual DOM and why is it useful?",
            "How would you optimize a React app that is rendering slowly?",
            "Explain the difference between controlled and uncontrolled components.",
            "What are React hooks and why were they introduced?"
        ],
        "hard": [
            "How would you implement a virtual scrolling list for millions of items?",
            "Explain how you would architect a large-scale React application.",
            "What are Web Workers and when would you use them?",
            "How does browser rendering work from HTML parsing to painting?",
            "Explain micro-frontends and their tradeoffs.",
            "How would you implement code splitting and lazy loading?",
            "Describe how you would build a real-time collaborative editor.",
            "How would you handle state management in a complex React app?"
        ]
    },
    "Backend Engineer": {
        "easy": [
            "What is a REST API and how does it work?",
            "Explain the difference between GET and POST requests.",
            "What is a database index and why is it useful?",
            "What is the difference between SQL and NoSQL databases?",
            "Explain what an API endpoint is.",
            "What is authentication and how does it differ from authorization?",
            "What is a foreign key in a database?",
            "Explain what JSON is and why it is used."
        ],
        "intermediate": [
            "How would you design a scalable REST API from scratch?",
            "Explain database normalization and when to denormalize.",
            "How does JWT authentication work?",
            "What is the N+1 query problem and how do you fix it?",
            "Explain the difference between synchronous and asynchronous programming.",
            "How would you implement rate limiting in an API?",
            "What is database connection pooling and why is it important?",
            "Explain how you would handle database migrations."
        ],
        "hard": [
            "How would you design a distributed task queue system?",
            "Explain CAP theorem and how it affects database design.",
            "How would you implement a caching strategy for a high-traffic API?",
            "Describe how you would handle database sharding.",
            "How would you design a system to handle 1 million requests per second?",
            "Explain event sourcing and CQRS patterns.",
            "How would you implement distributed transactions?",
            "Describe your approach to API versioning at scale."
        ]
    },
    "Full Stack Engineer": {
        "easy": [
            "What is the difference between frontend and backend development?",
            "Explain how HTTP requests work.",
            "What is a database and why do we use one?",
            "What is version control and why is it important?",
            "Explain what an API is in simple terms.",
            "What is the difference between a library and a framework?",
            "What is localhost and why do we use it for development?",
            "Explain what a cookie and a session are."
        ],
        "intermediate": [
            "How would you design the architecture for a full-stack web application?",
            "Explain how you would implement user authentication end-to-end.",
            "What is CORS and how do you handle it?",
            "How would you handle file uploads in a web application?",
            "Explain the difference between server-side and client-side rendering.",
            "How would you implement real-time features using WebSockets?",
            "What is a message queue and when would you use one?",
            "How do you handle environment variables across frontend and backend?"
        ],
        "hard": [
            "How would you architect a microservices-based full-stack application?",
            "Explain how you would implement end-to-end testing for a full-stack app.",
            "How would you handle authentication across microservices?",
            "Describe your approach to CI/CD for a full-stack application.",
            "How would you implement a real-time collaborative feature at scale?",
            "Explain how you would monitor and debug a production full-stack app.",
            "How would you design a multi-tenant SaaS application?",
            "Describe how you would migrate a monolith to microservices."
        ]
    },
    "Data Scientist": {
        "easy": [
            "What is the difference between supervised and unsupervised learning?",
            "Explain what a neural network is in simple terms.",
            "What is overfitting and how do you prevent it?",
            "What is the difference between classification and regression?",
            "Explain what a training and test set are.",
            "What is a confusion matrix?",
            "What is the difference between mean, median, and mode?",
            "What is feature engineering?"
        ],
        "intermediate": [
            "Explain the bias-variance tradeoff.",
            "How does gradient descent work?",
            "What is cross-validation and why is it important?",
            "Explain how a decision tree works.",
            "What is regularization and when would you use L1 vs L2?",
            "How would you handle imbalanced datasets?",
            "Explain the difference between bagging and boosting.",
            "How do you evaluate the performance of a regression model?"
        ],
        "hard": [
            "Explain how transformer architecture works in modern NLP models.",
            "How would you design an ML pipeline for production?",
            "Explain the mathematics behind backpropagation.",
            "How would you handle concept drift in a production ML model?",
            "Describe how you would build a recommendation system at scale.",
            "Explain attention mechanisms in deep learning.",
            "How would you approach A/B testing for an ML model?",
            "Describe your approach to feature selection for high-dimensional data."
        ]
    },
    "ML Engineer": {
        "easy": [
            "What is the difference between a data scientist and an ML engineer?",
            "Explain what model deployment means.",
            "What is a machine learning pipeline?",
            "What is Docker and why is it useful for ML?",
            "Explain what an API endpoint for a model looks like.",
            "What is model versioning and why is it important?",
            "What is the difference between batch and online inference?",
            "Explain what feature stores are."
        ],
        "intermediate": [
            "How would you deploy a machine learning model to production?",
            "Explain how you would monitor a model in production.",
            "What is MLflow and how do you use it for experiment tracking?",
            "How would you handle model retraining in production?",
            "Explain the difference between online and batch inference.",
            "How would you build a feature pipeline for real-time ML?",
            "What is model quantization and when would you use it?",
            "How do you handle data versioning in ML projects?"
        ],
        "hard": [
            "How would you design an ML platform from scratch?",
            "Explain how you would implement A/B testing for ML models.",
            "How would you handle serving 1000 ML model requests per second?",
            "Describe your approach to building a real-time ML inference system.",
            "How would you implement shadow deployment for ML models?",
            "Explain how you would build a self-healing ML pipeline.",
            "How would you design a multi-model serving architecture?",
            "Describe how you would implement continuous training for an ML model."
        ]
    },
    "DevOps Engineer": {
        "easy": [
            "What is the difference between DevOps and traditional IT operations?",
            "Explain what CI/CD means.",
            "What is Docker and what problem does it solve?",
            "What is Kubernetes at a high level?",
            "Explain what infrastructure as code means.",
            "What is the difference between a VM and a container?",
            "What is a load balancer and why do we use one?",
            "Explain what monitoring and alerting are."
        ],
        "intermediate": [
            "How would you set up a CI/CD pipeline from scratch?",
            "Explain how Docker networking works.",
            "How would you implement blue-green deployment?",
            "What is Terraform and how does it work?",
            "How would you monitor a production Kubernetes cluster?",
            "Explain how you would handle secrets management in a cloud environment.",
            "What is a service mesh and when would you use one?",
            "How would you implement auto-scaling for a web application?"
        ],
        "hard": [
            "How would you design a highly available multi-region infrastructure?",
            "Explain how you would implement zero-downtime deployments.",
            "How would you handle a major production outage?",
            "Describe your approach to disaster recovery planning.",
            "How would you implement GitOps at scale?",
            "Explain how you would secure a Kubernetes cluster in production.",
            "How would you design a cost-optimized cloud infrastructure?",
            "Describe how you would implement chaos engineering."
        ]
    },
    "Product Manager": {
        "easy": [
            "What is the role of a Product Manager?",
            "Explain what a user story is.",
            "What is the difference between a product roadmap and a sprint backlog?",
            "What are KPIs and why are they important?",
            "Explain what agile methodology is.",
            "What is a minimum viable product (MVP)?",
            "How do you prioritize features?",
            "What is user research and why is it important?"
        ],
        "intermediate": [
            "How would you prioritize a backlog with conflicting stakeholder demands?",
            "Explain how you would define success metrics for a new feature.",
            "How do you handle a situation where engineering says a feature is impossible?",
            "Describe your approach to running a product discovery process.",
            "How would you decide whether to build, buy, or partner for a new capability?",
            "Explain how you would conduct a competitive analysis.",
            "How do you balance short-term wins vs long-term product vision?",
            "Describe how you would handle a failed product launch."
        ],
        "hard": [
            "How would you define and execute a product strategy for a new market?",
            "Describe how you would turn around a declining product.",
            "How would you build and align a product organization across multiple teams?",
            "Explain how you would make a build vs buy decision for a critical feature.",
            "How would you approach pricing strategy for a new SaaS product?",
            "Describe how you would manage a product with conflicting user segments.",
            "How would you measure and improve product-market fit?",
            "Describe your approach to launching a product in a new geography."
        ]
    }
}

DEFAULT_FALLBACK = [
    "Tell me about yourself and your technical background.",
    "What is your greatest technical strength?",
    "Describe a challenging project you worked on recently.",
    "How do you stay up to date with new technologies?",
    "Tell me about a time you had to learn something quickly.",
    "How do you approach debugging a difficult problem?",
    "Describe your ideal development workflow.",
    "Where do you see yourself in 5 years?"
]


@router.post("/questions", response_model=QuestionsResponse)
async def generate_questions(req: QuestionRequest):
    try:
        user_message = (
            f"Generate exactly {req.count} technical interview questions for a {req.role} position "
            f"at {req.difficulty} difficulty level. "
            f"Questions must be specific to {req.role} skills and responsibilities. "
            f"Mix technical, problem-solving, and behavioral questions. "
            f'Return ONLY this JSON: {{"questions": ["question 1", "question 2"]}}'
        )

        raw = await call_llm(SYSTEM_PROMPT, user_message)
        raw = raw.strip()
        raw = re.sub(r"```json|```", "", raw).strip()

        # Try to parse JSON
        data = None
        try:
            data = json.loads(raw)
        except Exception:
            match = re.search(r'\{[^{}]*"questions".*?\}', raw, re.DOTALL)
            if match:
                try:
                    data = json.loads(match.group())
                except Exception:
                    pass

        if data and "questions" in data and isinstance(data["questions"], list):
            questions = [q for q in data["questions"] if isinstance(q, str) and len(q) > 10]
            if len(questions) >= 3:
                return QuestionsResponse(questions=questions)

        raise ValueError("Invalid response from AI")

    except Exception:
        # Use role and difficulty specific fallback
        role_questions = FALLBACK_QUESTIONS.get(req.role, {})
        difficulty_questions = role_questions.get(req.difficulty, [])

        if difficulty_questions:
            return QuestionsResponse(questions=difficulty_questions)
        else:
            return QuestionsResponse(questions=DEFAULT_FALLBACK)