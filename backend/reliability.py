import math


# Constants from the Chapter 4 MATLAB model
MAX_BS_DENSITY = 0.02
MAX_VEHICLE_SPEED = 30.0

BANDWIDTH = 40e6
DEFAULT_DATA_RATE_THRESHOLD = 100e6

TRANSMIT_POWER = 1.0
PATH_LOSS_EXPONENT = 3

G_TX = 1.0
G_RX = 1.0

SPEED_OF_LIGHT = 3e8
CARRIER_FREQUENCY = 2.1e9

BS_SAFETY_DISTANCE = 5.0
BS_HEIGHT = 8.0

ROAD_LENGTH = 2000.0
LAMBDA = 1.0

NOISE_POWER = BANDWIDTH * 273 * 1.38e-23

GAMMA_R = (
    G_TX
    * G_RX
    * (SPEED_OF_LIGHT / (4 * math.pi * CARRIER_FREQUENCY)) ** 2
)

def calculate_distances(bs_density: float):
    serving_distance = math.sqrt(
        BS_SAFETY_DISTANCE**2
        + BS_HEIGHT**2
        + (1 / (4 * bs_density**2))
    )

    num_base_stations = int(bs_density * ROAD_LENGTH)

    interfering_distances = []

    for k in range(1, num_base_stations):
        distance = math.sqrt(
            BS_SAFETY_DISTANCE**2
            + BS_HEIGHT**2
            + ((2 * k + 1) ** 2 / (4 * bs_density**2))
        )

        interfering_distances.append(distance)

    return {
        "serving_distance": serving_distance,
        "interfering_distances": interfering_distances,
    }

def calculate_reliability_parameters(
    bs_density: float,
    vehicle_speed: float,
    data_rate_threshold: float = DEFAULT_DATA_RATE_THRESHOLD,
    path_loss_exponent: float = PATH_LOSS_EXPONENT,
):
    distances = calculate_distances(bs_density)

    serving_distance = distances["serving_distance"]
    interfering_distances = distances["interfering_distances"]

    lambda_i = []

    for distance in interfering_distances:
        rate = LAMBDA / (
            TRANSMIT_POWER
            * GAMMA_R
            * distance ** (-path_loss_exponent)
        )

        lambda_i.append(rate)

    lambda_s = LAMBDA / (
        TRANSMIT_POWER
        * GAMMA_R
        * serving_distance ** (-path_loss_exponent)
    )

    handoff_fraction = (
        bs_density * vehicle_speed
    ) / (
        MAX_BS_DENSITY * MAX_VEHICLE_SPEED
    )

    gamma_threshold = (
        2 ** (
            data_rate_threshold
            / (
                BANDWIDTH
                * (1 - handoff_fraction)
            )
        )
        - 1
    )

    return {
        "lambda_i": lambda_i,
        "lambda_s": lambda_s,
        "handoff_fraction": handoff_fraction,
        "gamma_threshold": gamma_threshold,
    }

def calculate_outage_probability(
    gamma_threshold: float,
    lambda_i: list[float],
    lambda_s: float,
):
    cdf = 0.0

    for i in range(len(lambda_i)):
        weight = 1.0

        for j in range(len(lambda_i)):
            if j == i:
                continue

            weight *= (
                lambda_i[j]
                / (lambda_i[j] - lambda_i[i])
            )

        cdf += weight * (
            lambda_i[i]
            / (lambda_s * gamma_threshold + lambda_i[i])
        )

    outage_probability = 1 - cdf

    return outage_probability

def calculate_network_outage(
    bs_density: float,
    vehicle_speed: float,
    data_rate_threshold: float = DEFAULT_DATA_RATE_THRESHOLD,
    path_loss_exponent: float = PATH_LOSS_EXPONENT,
):
    parameters = calculate_reliability_parameters(
        bs_density=bs_density,
        vehicle_speed=vehicle_speed,
        data_rate_threshold=data_rate_threshold,
        path_loss_exponent=path_loss_exponent,
    )

    outage_probability = calculate_outage_probability(
        gamma_threshold=parameters["gamma_threshold"],
        lambda_i=parameters["lambda_i"],
        lambda_s=parameters["lambda_s"],
    )

    return {
        "bs_density": float(bs_density),
        "vehicle_speed": float(vehicle_speed),
        "data_rate_threshold": float(data_rate_threshold),
        "path_loss_exponent": float(path_loss_exponent),
        "handoff_fraction": float(parameters["handoff_fraction"]),
        "gamma_threshold": float(parameters["gamma_threshold"]),
        "outage_probability": float(outage_probability),
    }

def run_outage_sweep(
    vehicle_speed: float,
    min_bs_density: float = 0.001,
    max_bs_density: float = 0.02,
    step: float = 0.001,
    data_rate_threshold: float = DEFAULT_DATA_RATE_THRESHOLD,
    path_loss_exponent: float = PATH_LOSS_EXPONENT,
):
    results = []

    bs_density = min_bs_density

    while bs_density <= max_bs_density + 1e-12:
        result = calculate_network_outage(
            bs_density=bs_density,
            vehicle_speed=vehicle_speed,
            data_rate_threshold=data_rate_threshold,
            path_loss_exponent=path_loss_exponent,
        )

        results.append(result)

        bs_density += step

    return results

if __name__ == "__main__":
    speeds = [0, 5, 15, 25]

    for speed in speeds:
        results = run_outage_sweep(
            vehicle_speed=speed
        )

        print(f"\nVehicle speed: {speed} m/s")

        for result in results:
            print(
                result["bs_density"],
                result["outage_probability"]
            )