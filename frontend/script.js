const questionInput =
    document.getElementById("questionInput");

const askButton =
    document.getElementById("askButton");

const loading =
    document.getElementById("loading");

const responseSection =
    document.getElementById("responseSection");

const responseText =
    document.getElementById("responseText");

const metricsSection =
    document.getElementById("metricsSection");

const metricsContainer =
    document.getElementById("metricsContainer");

const chartsSection =
    document.getElementById("chartsSection");

const trafficFlowCanvas =
    document.getElementById("trafficFlowChart");

const bsDensityCanvas =
    document.getElementById("bsDensityChart");

const thesisPlotButton =
    document.getElementById("thesisPlotButton");

let trafficFlowChart = null;
let bsDensityChart = null;


askButton.addEventListener("click", async () => {

    const question = questionInput.value.trim();

    if (!question) {
        alert("Please enter a question.");
        return;
    }


    // Reset UI
    loading.classList.remove("hidden");

    responseSection.classList.add("hidden");
    metricsSection.classList.add("hidden");
    chartsSection.classList.add("hidden");

    metricsContainer.innerHTML = "";
    responseText.textContent = "";


    try {

        const response = await fetch(
            "http://127.0.0.1:8000/ask",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    question: question
                })
            }
        );


        if (!response.ok) {
            throw new Error(
                `Request failed with status ${response.status}`
            );
        }


        const data = await response.json();


        // Show Gemini explanation
        responseText.textContent = data.answer;

        responseSection.classList.remove("hidden");


        // Show structured optimizer results
        if (data.tool_result) {
            displayToolResult(data.tool_result);
        }


    } catch (error) {

        console.error(error);

        responseText.textContent =
            "Something went wrong while contacting the network agent.";

        responseSection.classList.remove("hidden");

    } finally {

        loading.classList.add("hidden");

    }

});


function displayToolResult(toolResult) {

    const tool = toolResult.tool;
    const data = toolResult.data;

    metricsContainer.innerHTML = "";
    metricsContainer.className = "";


    if (tool === "optimize_network") {

        const card = createScenarioCard(
            "Network Scenario",
            data
        );

        metricsContainer.appendChild(card);

        metricsSection.classList.remove("hidden");

    }


    else if (tool === "compare_network_scenarios") {

        metricsContainer.className =
            "scenario-grid";

        const card1 = createScenarioCard(
            "Scenario 1",
            data.scenario_1
        );

        const card2 = createScenarioCard(
            "Scenario 2",
            data.scenario_2
        );

        metricsContainer.appendChild(card1);
        metricsContainer.appendChild(card2);

        metricsSection.classList.remove("hidden");

    }


    else if (tool === "analyze_threshold_range") {

        displayThresholdRange(data);

    }

}


function createScenarioCard(title, scenario) {

    const card = document.createElement("div");

    card.className = "metric-card";


    if (!scenario.feasible) {

        card.innerHTML = `
            <h3>${title}</h3>

            <p class="not-feasible">
                Scenario is not feasible.
            </p>
        `;

        return card;
    }


    const thresholdMbps =
        scenario.inputs.data_rate_threshold / 1e6;

    const alpha =
        scenario.inputs.path_loss_exponent;

    const bsDensity =
        scenario.bs_density.mu_opt;

    const achievableRateMbps =
        scenario.speed.achievable_rate / 1e6;

    const optimalSpeed =
        scenario.speed.optimal_speed;

    const trafficFlow =
        scenario.traffic.traffic_flow;


    card.innerHTML = `
        <h3>${title}</h3>

        <div class="metric-row">
            <span>Rate threshold</span>
            <strong>
                ${thresholdMbps.toFixed(2)} Mbps
            </strong>
        </div>

        <div class="metric-row">
            <span>Path loss exponent</span>
            <strong>
                ${alpha}
            </strong>
        </div>

        <div class="metric-row">
            <span>Optimal BS density</span>
            <strong>
                ${bsDensity.toFixed(3)} BS/m
            </strong>
        </div>

        <div class="metric-row">
            <span>Achievable rate</span>
            <strong>
                ${achievableRateMbps.toFixed(2)} Mbps
            </strong>
        </div>

        <div class="metric-row">
            <span>Optimal speed</span>
            <strong>
                ${optimalSpeed.toFixed(2)} m/s
            </strong>
        </div>

        <div class="metric-row">
            <span>Traffic flow</span>
            <strong>
                ${trafficFlow.toFixed(2)} vehicles/s
            </strong>
        </div>
    `;


    return card;

}


function displayThresholdRange(results) {

    metricsContainer.className = "";


    const table = document.createElement("table");

    table.className = "results-table";


    table.innerHTML = `
        <thead>
            <tr>
                <th>Threshold</th>
                <th>BS Density</th>
                <th>Speed</th>
                <th>Traffic Flow</th>
            </tr>
        </thead>

        <tbody></tbody>
    `;


    const body = table.querySelector("tbody");


    results.forEach(result => {

        const row = document.createElement("tr");


        if (!result.feasible) {

            row.innerHTML = `
                <td>
                    ${(result.inputs.data_rate_threshold / 1e6)
                        .toFixed(0)} Mbps
                </td>

                <td colspan="3">
                    Not feasible
                </td>
            `;

            body.appendChild(row);

            return;
        }


        row.innerHTML = `
            <td>
                ${(result.inputs.data_rate_threshold / 1e6)
                    .toFixed(0)} Mbps
            </td>

            <td>
                ${result.bs_density.mu_opt.toFixed(3)}
                BS/m
            </td>

            <td>
                ${result.speed.optimal_speed.toFixed(2)}
                m/s
            </td>

            <td>
                ${result.traffic.traffic_flow.toFixed(2)}
                vehicles/s
            </td>
        `;


        body.appendChild(row);

    });


    metricsContainer.appendChild(table);

    metricsSection.classList.remove("hidden");


    drawThresholdCharts(results);

}


function drawThresholdCharts(results) {

    const feasibleResults = results.filter(
        result => result.feasible
    );


    if (feasibleResults.length === 0) {

        chartsSection.classList.add("hidden");

        return;
    }


    const thresholds = feasibleResults.map(
        result =>
            result.inputs.data_rate_threshold / 1e6
    );


    const trafficFlows = feasibleResults.map(
        result =>
            result.traffic.traffic_flow
    );


    const bsDensities = feasibleResults.map(
        result =>
            result.bs_density.mu_opt
    );


    // Destroy old charts before creating new ones
    if (trafficFlowChart) {

        trafficFlowChart.destroy();

        trafficFlowChart = null;

    }


    if (bsDensityChart) {

        bsDensityChart.destroy();

        bsDensityChart = null;

    }


    trafficFlowChart = new Chart(
        trafficFlowCanvas,
        {
            type: "line",

            data: {

                labels: thresholds,

                datasets: [
                    {
                        label: "Traffic Flow",
                        data: trafficFlows,
                        borderWidth: 2,
                        pointRadius: 2,
                        tension: 0.2
                    }
                ]

            },

            options: {

                responsive: true,

                maintainAspectRatio: true,

                plugins: {

                    title: {
                        display: true,
                        text:
                            "Traffic Flow vs Data Rate Threshold"
                    },

                    legend: {
                        display: true
                    }

                },

                scales: {

                    x: {

                        title: {
                            display: true,
                            text:
                                "Data Rate Threshold (Mbps)"
                        }

                    },

                    y: {

                        title: {
                            display: true,
                            text:
                                "Traffic Flow (vehicles/s)"
                        },

                        beginAtZero: true

                    }

                }

            }

        }
    );


    bsDensityChart = new Chart(
        bsDensityCanvas,
        {
            type: "line",

            data: {

                labels: thresholds,

                datasets: [
                    {
                        label:
                            "Optimal BS Density",
                        data: bsDensities,
                        borderWidth: 2,
                        pointRadius: 2,
                        tension: 0.2
                    }
                ]

            },

            options: {

                responsive: true,

                maintainAspectRatio: true,

                plugins: {

                    title: {
                        display: true,
                        text:
                            "Optimal BS Density vs Data Rate Threshold"
                    },

                    legend: {
                        display: true
                    }

                },

                scales: {

                    x: {

                        title: {
                            display: true,
                            text:
                                "Data Rate Threshold (Mbps)"
                        }

                    },

                    y: {

                        title: {
                            display: true,
                            text:
                                "Optimal BS Density (BS/m)"
                        },

                        beginAtZero: true

                    }

                }

            }

        }
    );


    chartsSection.classList.remove("hidden");

}

thesisPlotButton.addEventListener("click", async () => {

    loading.classList.remove("hidden");

    try {

        const response = await fetch(
            "http://127.0.0.1:8000/sweep",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    start_threshold: 900000000,
                    end_threshold: 1100000000,
                    num_points: 100,
                    path_loss_exponents: [2, 3, 4]
                })
            }
        );

        if (!response.ok) {
            throw new Error(
                `Sweep request failed: ${response.status}`
            );
        }

        const data = await response.json();

        drawMultiAlphaCharts(data.results);

    } catch (error) {

        console.error(error);

        alert("Could not generate thesis plots.");

    } finally {

        loading.classList.add("hidden");

    }

});

function drawMultiAlphaCharts(resultsByAlpha) {

    if (trafficFlowChart) {
        trafficFlowChart.destroy();
        trafficFlowChart = null;
    }

    if (bsDensityChart) {
        bsDensityChart.destroy();
        bsDensityChart = null;
    }


    const alphaValues = Object.keys(resultsByAlpha);


    const trafficDatasets = [];
    const bsDensityDatasets = [];

    let thresholds = [];


    alphaValues.forEach(alpha => {

        const results = resultsByAlpha[alpha]
            .filter(result => result.feasible);


        if (thresholds.length === 0) {

            thresholds = results.map(
                result =>
                    result.inputs.data_rate_threshold / 1e6
            );

        }


        const trafficFlows = results.map(
            result =>
                result.traffic.traffic_flow
        );


        const bsDensities = results.map(
            result =>
                result.bs_density.mu_opt
        );


        trafficDatasets.push({
            label: `alpha = ${alpha}`,
            data: trafficFlows,
            borderWidth: 2,
            pointRadius: 0,
            tension: 0
        });


        bsDensityDatasets.push({
            label: `alpha = ${alpha}`,
            data: bsDensities,
            borderWidth: 2,
            pointRadius: 0,
            tension: 0
        });

    });


    trafficFlowChart = new Chart(
        trafficFlowCanvas,
        {
            type: "line",

            data: {
                labels: thresholds,
                datasets: trafficDatasets
            },

            options: {

                responsive: true,

                plugins: {

                    title: {
                        display: true,
                        text:
                            "Traffic Flow vs Data Rate Threshold"
                    },

                    legend: {
                        display: true
                    }

                },

                scales: {

                    x: {
                        title: {
                            display: true,
                            text:
                                "Data Rate Threshold (Mbps)"
                        }
                    },

                    y: {
                        title: {
                            display: true,
                            text:
                                "Traffic Flow (vehicles/s)"
                        }
                    }

                }

            }

        }
    );


    bsDensityChart = new Chart(
        bsDensityCanvas,
        {
            type: "line",

            data: {
                labels: thresholds,
                datasets: bsDensityDatasets
            },

            options: {

                responsive: true,

                plugins: {

                    title: {
                        display: true,
                        text:
                            "Optimal BS Density vs Data Rate Threshold"
                    },

                    legend: {
                        display: true
                    }

                },

                scales: {

                    x: {
                        title: {
                            display: true,
                            text:
                                "Data Rate Threshold (Mbps)"
                        }
                    },

                    y: {
                        title: {
                            display: true,
                            text:
                                "Optimal BS Density (BS/m)"
                        }
                    }

                }

            }

        }
    );


    chartsSection.classList.remove("hidden");

}