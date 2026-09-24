import math
import numpy as np

from scipy.special import exp1


def calculate_bs_density(
    data_rate_threshold: float,
    path_loss_exponent: float,
    bandwidth: float = 40e6,
    transmit_power: float = 1.0,
    max_bs_density: float = 0.45,
):
    g_tx = 1
    g_rx = 1
    speed_of_light = 3e8
    carrier_frequency = 2.1e9

    noise_power = bandwidth * 273 * 1.38e-23

    gamma_r = (
        g_tx
        * g_rx
        * (speed_of_light / (4 * math.pi * carrier_frequency)) ** 2
    )

    gamma_bar = (gamma_r * transmit_power) / noise_power

    alpha = path_loss_exponent
    r_th = data_rate_threshold
    w_c = bandwidth

    # Candidate optimal BS density
    mu_hat = (
        1 / (2 * gamma_bar ** (1 / alpha))
    ) * (
        2
        ** (
            (
                math.sqrt(r_th)
                * math.sqrt(r_th + 4 * w_c * alpha)
                + r_th
            )
            / (2 * w_c)
        )
    ) ** (1 / alpha)

    # Minimum BS density required by data-rate constraint
    mu_data = (
        1 / (2 * gamma_bar ** (1 / alpha))
    ) * (
        2 ** (r_th / w_c) - 1
    ) ** (1 / alpha)

    if mu_hat < mu_data:
        mu_opt = 0
        feasible = False

    elif mu_hat > max_bs_density:
        mu_opt = max_bs_density
        feasible = True

    else:
        mu_opt = mu_hat
        feasible = True

    return {
        "mu_hat": float(mu_hat),
        "mu_data": float(mu_data),
        "mu_opt": float(mu_opt),
        "feasible": feasible,
    }


def calculate_optimal_speed(
    data_rate_threshold: float,
    path_loss_exponent: float,
    bs_density: float,
    bandwidth: float = 40e6,
    transmit_power: float = 1.0,
    max_bs_density: float = 0.45,
    max_vehicle_speed: float = 30.0,
    crash_probability: float = 0.0015,
    average_spacing: float = 1.0,
    processing_time: float = 0.00015,
):
    g_tx = 1
    g_rx = 1
    speed_of_light = 3e8
    carrier_frequency = 2.1e9

    noise_power = bandwidth * 273 * 1.38e-23

    gamma_r = (
        g_tx
        * g_rx
        * (speed_of_light / (4 * math.pi * carrier_frequency)) ** 2
    )

    # MATLAB:
    # h_d = 1/(mu_max*V_max)
    handoff_rate_normalizer = 1 / (
        max_bs_density * max_vehicle_speed
    )

    # SNR
    snr = (
        gamma_r
        * transmit_power
        * (2 * bs_density) ** path_loss_exponent
    ) / noise_power

    # Achievable data rate
    achievable_rate = bandwidth * math.log2(1 + snr)

    # Data-rate constrained velocity
    data_limited_speed = (
        1 / (handoff_rate_normalizer * bs_density)
    ) * (
        1 - data_rate_threshold / achievable_rate
    )

    # Safety-constrained velocity
    safe_speed = (
        -average_spacing
        * math.log(1 - crash_probability)
        / processing_time
    )

    # Final optimal velocity
    optimal_speed = min(
        safe_speed,
        max_vehicle_speed,
        max(data_limited_speed, 0),
    )

    return {
        "snr": float(snr),
        "achievable_rate": float(achievable_rate),
        "data_limited_speed": float(data_limited_speed),
        "safe_speed": float(safe_speed),
        "optimal_speed": float(optimal_speed),
    }


def calculate_traffic_flow(
    optimal_speed: float,
    average_spacing: float = 1.0,
    minimum_spacing: float = 1.0,
):
    """
    Analytical traffic-flow equation from Chapter 3 / fig3.m.
    """

    lambd = 1 / average_spacing

    y = (
        math.exp(minimum_spacing * lambd)
        * exp1(minimum_spacing * lambd)
    )

    traffic_flow = optimal_speed * lambd * y

    return {
        "traffic_flow": float(traffic_flow),
        "vehicle_density": float(lambd),
        "flow_factor": float(y),
    }


def optimize_network(
    data_rate_threshold: float,
    path_loss_exponent: float,
):
    density_result = calculate_bs_density(
        data_rate_threshold=data_rate_threshold,
        path_loss_exponent=path_loss_exponent,
    )

    if not density_result["feasible"]:
        return {
            "feasible": False,
            "inputs": {
                "data_rate_threshold": data_rate_threshold,
                "path_loss_exponent": path_loss_exponent,
            },
            "reason": "Data-rate requirement cannot be satisfied.",
        }

    speed_result = calculate_optimal_speed(
        data_rate_threshold=data_rate_threshold,
        path_loss_exponent=path_loss_exponent,
        bs_density=density_result["mu_opt"],
    )

    flow_result = calculate_traffic_flow(
        optimal_speed=speed_result["optimal_speed"],
    )

    return {
        "feasible": True,
        "inputs": {
            "data_rate_threshold": float(data_rate_threshold),
            "path_loss_exponent": float(path_loss_exponent),
        },
        "bs_density": density_result,
        "speed": speed_result,
        "traffic": flow_result,
    }


def run_threshold_sweep(
    start_threshold: float = 0.9e9,
    end_threshold: float = 1.1e9,
    num_points: int = 100,
    path_loss_exponent: float = 3,
):
    thresholds = np.linspace(
        start_threshold,
        end_threshold,
        num_points,
    )

    results = []

    for threshold in thresholds:
        result = optimize_network(
            data_rate_threshold=float(threshold),
            path_loss_exponent=path_loss_exponent,
        )

        results.append(result)

    return results


if __name__ == "__main__":
    results = run_threshold_sweep(
        path_loss_exponent=3,
    )

    for result in results[:5]:
        print(
            result["inputs"]["data_rate_threshold"],
            result["bs_density"]["mu_opt"],
            result["traffic"]["traffic_flow"],
        )