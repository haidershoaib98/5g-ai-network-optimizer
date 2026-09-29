from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from backend.optimizer import optimize_network, run_threshold_sweep
from backend.agent import ask_agent
from backend.reliability import (
    calculate_network_outage,
    run_outage_sweep,
)

from backend.network_intelligence import (
    analyze_optimized_network_reliability,
)

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

class OutageRequest(BaseModel):
    bs_density: float
    vehicle_speed: float
    data_rate_threshold: float = 100e6
    path_loss_exponent: float = 3


class OutageSweepRequest(BaseModel):
    vehicle_speeds: list[float] = [0, 5, 15, 25]
    min_bs_density: float = 0.001
    max_bs_density: float = 0.02
    step: float = 0.001
    data_rate_threshold: float = 100e6
    path_loss_exponent: float = 3

class CombinedAnalysisRequest(BaseModel):
    data_rate_threshold: float
    path_loss_exponent: float
    reliability_vehicle_speed: float

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

@app.post("/outage")
def outage(request: OutageRequest):
    return calculate_network_outage(
        bs_density=request.bs_density,
        vehicle_speed=request.vehicle_speed,
        data_rate_threshold=request.data_rate_threshold,
        path_loss_exponent=request.path_loss_exponent,
    )

@app.post("/outage/sweep")
def outage_sweep(request: OutageSweepRequest):
    results = {}

    for speed in request.vehicle_speeds:
        results[str(speed)] = run_outage_sweep(
            vehicle_speed=speed,
            min_bs_density=request.min_bs_density,
            max_bs_density=request.max_bs_density,
            step=request.step,
            data_rate_threshold=request.data_rate_threshold,
            path_loss_exponent=request.path_loss_exponent,
        )

    return {
        "vehicle_speeds": request.vehicle_speeds,
        "min_bs_density": request.min_bs_density,
        "max_bs_density": request.max_bs_density,
        "step": request.step,
        "results": results,
    }

@app.post("/combined-analysis")
def combined_analysis(request: CombinedAnalysisRequest):
    return analyze_optimized_network_reliability(
        data_rate_threshold=request.data_rate_threshold,
        path_loss_exponent=request.path_loss_exponent,
        reliability_vehicle_speed=request.reliability_vehicle_speed,
    )