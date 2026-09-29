from backend.optimizer import optimize_network
from backend.reliability import calculate_network_outage


RELIABILITY_MIN_BS_DENSITY = 0.001
RELIABILITY_MAX_BS_DENSITY = 0.02


def analyze_optimized_network_reliability(
    data_rate_threshold: float,
    path_loss_exponent: float,
    reliability_vehicle_speed: float,
):
    """
    Run the Chapter 3 optimizer first, then evaluate whether
    the optimized BS density lies inside the validated operating
    range of the Chapter 4 reliability model.

    Reliability is only calculated when the optimized BS density
    is between 0.001 and 0.02 BS/m.
    """

    optimization = optimize_network(
        data_rate_threshold=data_rate_threshold,
        path_loss_exponent=path_loss_exponent,
    )

    if not optimization["feasible"]:
        return {
            "feasible": False,
            "reason": "Optimization scenario is not feasible.",
            "optimization": optimization,
            "reliability": None,
        }


    optimized_bs_density = (
        optimization["bs_density"]["mu_opt"]
    )


    reliability_domain_valid = (
        RELIABILITY_MIN_BS_DENSITY
        <= optimized_bs_density
        <= RELIABILITY_MAX_BS_DENSITY
    )


    if not reliability_domain_valid:
        return {
            "feasible": True,

            "inputs": {
                "data_rate_threshold":
                    float(data_rate_threshold),

                "path_loss_exponent":
                    float(path_loss_exponent),

                "reliability_vehicle_speed":
                    float(reliability_vehicle_speed),
            },

            "optimization":
                optimization,

            "reliability":
                None,

            "reliability_domain_valid":
                False,

            "reliability_message": (
                "The optimized BS density is outside the "
                "evaluated range of the Chapter 4 reliability "
                "model. Reliability analysis was not performed."
            ),

            "reliability_model_range": {
                "min_bs_density":
                    RELIABILITY_MIN_BS_DENSITY,

                "max_bs_density":
                    RELIABILITY_MAX_BS_DENSITY,
            },
        }


    reliability = calculate_network_outage(
        bs_density=optimized_bs_density,
        vehicle_speed=reliability_vehicle_speed,
        data_rate_threshold=data_rate_threshold,
        path_loss_exponent=path_loss_exponent,
    )


    return {
        "feasible": True,

        "inputs": {
            "data_rate_threshold":
                float(data_rate_threshold),

            "path_loss_exponent":
                float(path_loss_exponent),

            "reliability_vehicle_speed":
                float(reliability_vehicle_speed),
        },

        "optimization":
            optimization,

        "reliability":
            reliability,

        "reliability_domain_valid":
            True,

        "reliability_model_range": {
            "min_bs_density":
                RELIABILITY_MIN_BS_DENSITY,

            "max_bs_density":
                RELIABILITY_MAX_BS_DENSITY,
        },
    }


if __name__ == "__main__":

    result = analyze_optimized_network_reliability(
        data_rate_threshold=1e9,
        path_loss_exponent=3,
        reliability_vehicle_speed=15,
    )

    print(result)