from mcp.server.mcpserver import MCPServer

from backend.optimizer import (
    optimize_network,
    run_threshold_sweep,
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


if __name__ == "__main__":
    mcp.run()