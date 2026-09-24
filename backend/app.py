from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from backend.optimizer import optimize_network, run_threshold_sweep
from backend.agent import ask_agent

app = FastAPI(
    title="5G Network Intelligence API",
    description="AI-assisted CAV V2I network optimization",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class OptimizeRequest(BaseModel):
    data_rate_threshold: float
    path_loss_exponent: float


class AskRequest(BaseModel):
    question: str


@app.get("/")
def root():
    return {
        "message": "5G AI Network Optimizer API is running"
    }


@app.post("/optimize")
def optimize(request: OptimizeRequest):
    return optimize_network(
        data_rate_threshold=request.data_rate_threshold,
        path_loss_exponent=request.path_loss_exponent,
    )


@app.post("/ask")
def ask(request: AskRequest):
    result = ask_agent(request.question)

    return {
        "question": request.question,
        "answer": result["answer"],
        "tool_result": result["tool_result"],
    }

class SweepRequest(BaseModel):
    start_threshold: float = 0.9e9
    end_threshold: float = 1.1e9
    num_points: int = 100
    path_loss_exponents: list[float] = [2, 3, 4]


@app.post("/sweep")
def sweep(request: SweepRequest):

    results = {}

    for alpha in request.path_loss_exponents:
        results[str(alpha)] = run_threshold_sweep(
            start_threshold=request.start_threshold,
            end_threshold=request.end_threshold,
            num_points=request.num_points,
            path_loss_exponent=alpha,
        )

    return {
        "start_threshold": request.start_threshold,
        "end_threshold": request.end_threshold,
        "num_points": request.num_points,
        "results": results,
    }