import matplotlib.pyplot as plt

from backend.reliability import run_outage_sweep


speeds = [0, 5, 15, 25]

for speed in speeds:
    results = run_outage_sweep(vehicle_speed=speed)

    bs_densities = [
        result["bs_density"]
        for result in results
    ]

    outage_probabilities = [
        result["outage_probability"]
        for result in results
    ]

    plt.plot(
        bs_densities,
        outage_probabilities,
        marker="o",
        label=f"V = {speed} m/s",
    )


plt.xlabel("BS Density (μ) [BS/m]")
plt.ylabel("Outage Probability")
plt.title("Outage Probability vs BS Density")
plt.grid(True)
plt.legend()

plt.show()