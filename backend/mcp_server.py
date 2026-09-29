import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


from mcp.server.mcpserver import MCPServer

from backend.optimizer import (
    optimize_network,
    run_threshold_sweep,
)

from backend.reliability import (
    calculate_network_outage,
    run_outage_sweep,
)


mcp = MCPServer("5G Network Intelligence")


@mcp.tool()
def optimize_network_scenario(
    data_rate_threshold: float,
    path_loss_exponent: float,
):
    """
    Optimize one CAV V2I network scenario.

    Args:
        data_rate_threshold:
            Required data rate in bits per second.

        path_loss_exponent:
            Wireless path loss exponent.

    Returns:
        Optimal BS density, achievable rate,
        optimal vehicle speed, and traffic flow.
    """

    return optimize_network(
        data_rate_threshold=data_rate_threshold,
        path_loss_exponent=path_loss_exponent,
    )


@mcp.tool()
def compare_network_scenarios(
    data_rate_threshold_1: float,
    path_loss_exponent_1: float,
    data_rate_threshold_2: float,
    path_loss_exponent_2: float,
):
    """
    Compare two CAV V2I network scenarios.
    """

    scenario_1 = optimize_network(
        data_rate_threshold=data_rate_threshold_1,
        path_loss_exponent=path_loss_exponent_1,
    )

    scenario_2 = optimize_network(
        data_rate_threshold=data_rate_threshold_2,
        path_loss_exponent=path_loss_exponent_2,
    )

    return {
        "scenario_1": scenario_1,
        "scenario_2": scenario_2,
    }


@mcp.tool()
def analyze_threshold_range(
    start_threshold: float,
    end_threshold: float,
    path_loss_exponent: float,
    num_points: int = 20,
):
    """
    Analyze network performance over a range
    of data-rate thresholds.
    """

    return run_threshold_sweep(
        start_threshold=start_threshold,
        end_threshold=end_threshold,
        num_points=num_points,
        path_loss_exponent=path_loss_exponent,
    )

from backend.reliability import (
    calculate_network_outage,
    run_outage_sweep,
)


@mcp.tool()
def calculate_outage(
    bs_density: float,
    vehicle_speed: float,
    data_rate_threshold: float = 100e6,
    path_loss_exponent: float = 3,
):
    return calculate_network_outage(
        bs_density=bs_density,
        vehicle_speed=vehicle_speed,
        data_rate_threshold=data_rate_threshold,
        path_loss_exponent=path_loss_exponent,
    )


@mcp.tool()
def analyze_outage_range(
    vehicle_speed: float,
    min_bs_density: float = 0.001,
    max_bs_density: float = 0.02,
    step: float = 0.001,
    data_rate_threshold: float = 100e6,
    path_loss_exponent: float = 3,
):
    return run_outage_sweep(
        vehicle_speed=vehicle_speed,
        min_bs_density=min_bs_density,
        max_bs_density=max_bs_density,
        step=step,
        data_rate_threshold=data_rate_threshold,
        path_loss_exponent=path_loss_exponent,
    )


if __name__ == "__main__":
    mcp.run()