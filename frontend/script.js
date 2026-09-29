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

const outageCanvas =
    document.getElementById("outageChart");

const outageChartCard =
    document.getElementById("outageChartCard");

const thesisPlotButton =
    document.getElementById("thesisPlotButton");


// Existing chart cards
const trafficFlowChartCard =
    trafficFlowCanvas.closest(".chart-card");

const bsDensityChartCard =
    bsDensityCanvas.closest(".chart-card");


let trafficFlowChart = null;
let bsDensityChart = null;
let outageChart = null;


// --------------------------------------------------
// ASK AGENT
// --------------------------------------------------

askButton.addEventListener("click", async () => {

    const question = questionInput.value.trim();

    if (!question) {
        alert("Please enter a question.");
        return;
    }


    resetUI();

    loading.classList.remove("hidden");


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


        // Show structured tool results
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


// --------------------------------------------------
// RESET UI
// --------------------------------------------------

function resetUI() {

    responseSection.classList.add("hidden");
    metricsSection.classList.add("hidden");
    chartsSection.classList.add("hidden");

    metricsContainer.innerHTML = "";
    metricsContainer.className = "";

    responseText.textContent = "";

    trafficFlowChartCard.classList.add("hidden");
    bsDensityChartCard.classList.add("hidden");

    if (outageChartCard) {
        outageChartCard.classList.add("hidden");
    }

}


// --------------------------------------------------
// TOOL RESULT ROUTER
// --------------------------------------------------

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


    else if (tool === "calculate_outage") {

        displayOutageResult(data);

    }


    else if (tool === "analyze_outage_range") {

        displayOutageRange(data);

    }


    else if (
        tool === "analyze_optimized_network_reliability"
    ) {

        displayCombinedAnalysis(data);

    }

}


// --------------------------------------------------
// OPTIMIZATION SCENARIO CARD
// --------------------------------------------------

function createScenarioCard(title, scenario) {

    const card =
        document.createElement("div");

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


// --------------------------------------------------
// SINGLE OUTAGE RESULT
// --------------------------------------------------

function displayOutageResult(data) {

    const card = createOutageCard(
        "Wireless Reliability",
        data
    );

    metricsContainer.appendChild(card);

    metricsSection.classList.remove("hidden");

}


function createOutageCard(title, data) {

    const card =
        document.createElement("div");

    card.className = "metric-card";


    const thresholdMbps =
        data.data_rate_threshold / 1e6;

    const handoffPercent =
        data.handoff_fraction * 100;

    const outagePercent =
        data.outage_probability * 100;


    card.innerHTML = `
        <h3>${title}</h3>

        <div class="metric-row">
            <span>BS density</span>
            <strong>
                ${data.bs_density.toFixed(3)} BS/m
            </strong>
        </div>

        <div class="metric-row">
            <span>Vehicle speed</span>
            <strong>
                ${data.vehicle_speed.toFixed(2)} m/s
            </strong>
        </div>

        <div class="metric-row">
            <span>Rate threshold</span>
            <strong>
                ${thresholdMbps.toFixed(2)} Mbps
            </strong>
        </div>

        <div class="metric-row">
            <span>Path loss exponent</span>
            <strong>
                ${data.path_loss_exponent}
            </strong>
        </div>

        <div class="metric-row">
            <span>Handoff fraction</span>
            <strong>
                ${handoffPercent.toFixed(2)}%
            </strong>
        </div>

        <div class="metric-row">
            <span>SINR threshold</span>
            <strong>
                ${data.gamma_threshold.toFixed(3)}
            </strong>
        </div>

        <div class="metric-row">
            <span>Outage probability</span>
            <strong>
                ${outagePercent.toFixed(2)}%
            </strong>
        </div>
    `;


    return card;

}


// --------------------------------------------------
// COMBINED OPTIMIZATION + RELIABILITY
// --------------------------------------------------

function displayCombinedAnalysis(data) {

    metricsContainer.innerHTML = "";

    metricsContainer.className =
        "scenario-grid";


    const optimization =
        data.optimization;


    // Optimization card
    const optimizationCard =
        createScenarioCard(
            "Optimized Network",
            optimization
        );


    metricsContainer.appendChild(
        optimizationCard
    );


    // Reliability card
    const reliabilityCard =
        document.createElement("div");

    reliabilityCard.className =
        "metric-card";


    if (
        data.reliability_domain_valid &&
        data.reliability
    ) {

        const reliability =
            data.reliability;

        const outagePercent =
            reliability.outage_probability * 100;

        const handoffPercent =
            reliability.handoff_fraction * 100;

        const thresholdMbps =
            reliability.data_rate_threshold / 1e6;


        reliabilityCard.innerHTML = `
            <h3>Reliability Evaluation</h3>

            <div class="metric-row">
                <span>BS density</span>
                <strong>
                    ${reliability.bs_density.toFixed(3)}
                    BS/m
                </strong>
            </div>

            <div class="metric-row">
                <span>Vehicle speed</span>
                <strong>
                    ${reliability.vehicle_speed.toFixed(2)}
                    m/s
                </strong>
            </div>

            <div class="metric-row">
                <span>Rate threshold</span>
                <strong>
                    ${thresholdMbps.toFixed(2)}
                    Mbps
                </strong>
            </div>

            <div class="metric-row">
                <span>Handoff fraction</span>
                <strong>
                    ${handoffPercent.toFixed(2)}%
                </strong>
            </div>

            <div class="metric-row">
                <span>Outage probability</span>
                <strong>
                    ${outagePercent.toFixed(2)}%
                </strong>
            </div>
        `;

    } else {

        const optimizedDensity =
            optimization.bs_density.mu_opt;

        const minDensity =
            data.reliability_model_range
                .min_bs_density;

        const maxDensity =
            data.reliability_model_range
                .max_bs_density;


        reliabilityCard.innerHTML = `
            <h3>Reliability Evaluation</h3>

            <div class="metric-row">
                <span>Optimized BS density</span>
                <strong>
                    ${optimizedDensity.toFixed(3)}
                    BS/m
                </strong>
            </div>

            <div class="metric-row">
                <span>Reliability model range</span>
                <strong>
                    ${minDensity.toFixed(3)}
                    – ${maxDensity.toFixed(3)}
                    BS/m
                </strong>
            </div>

            <p class="not-feasible">
                Reliability was not evaluated because
                the optimized BS density is outside the
                evaluated operating range of the
                reliability model.
            </p>
        `;

    }


    metricsContainer.appendChild(
        reliabilityCard
    );


    metricsSection.classList.remove(
        "hidden"
    );

}


// --------------------------------------------------
// THRESHOLD RANGE TABLE
// --------------------------------------------------

function displayThresholdRange(results) {

    metricsContainer.className = "";


    const table =
        document.createElement("table");

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


    const body =
        table.querySelector("tbody");


    results.forEach(result => {

        const row =
            document.createElement("tr");


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


// --------------------------------------------------
// OUTAGE RANGE TABLE
// --------------------------------------------------

function displayOutageRange(results) {

    metricsContainer.className = "";


    const table =
        document.createElement("table");

    table.className = "results-table";


    table.innerHTML = `
        <thead>
            <tr>
                <th>BS Density</th>
                <th>Vehicle Speed</th>
                <th>Handoff</th>
                <th>Outage Probability</th>
            </tr>
        </thead>

        <tbody></tbody>
    `;


    const body =
        table.querySelector("tbody");


    results.forEach(result => {

        const row =
            document.createElement("tr");

        const handoffPercent =
            result.handoff_fraction * 100;

        const outagePercent =
            result.outage_probability * 100;


        row.innerHTML = `
            <td>
                ${result.bs_density.toFixed(3)}
                BS/m
            </td>

            <td>
                ${result.vehicle_speed.toFixed(2)}
                m/s
            </td>

            <td>
                ${handoffPercent.toFixed(2)}%
            </td>

            <td>
                ${outagePercent.toFixed(2)}%
            </td>
        `;


        body.appendChild(row);

    });


    metricsContainer.appendChild(table);

    metricsSection.classList.remove("hidden");


    drawOutageChart(results);

}


// --------------------------------------------------
// THRESHOLD CHARTS
// --------------------------------------------------

function drawThresholdCharts(results) {

    const feasibleResults =
        results.filter(
            result => result.feasible
        );


    if (feasibleResults.length === 0) {

        chartsSection.classList.add("hidden");

        return;
    }


    destroyAllCharts();


    trafficFlowChartCard.classList.remove("hidden");
    bsDensityChartCard.classList.remove("hidden");

    if (outageChartCard) {
        outageChartCard.classList.add("hidden");
    }


    const thresholds =
        feasibleResults.map(
            result =>
                result.inputs.data_rate_threshold / 1e6
        );


    const trafficFlows =
        feasibleResults.map(
            result =>
                result.traffic.traffic_flow
        );


    const bsDensities =
        feasibleResults.map(
            result =>
                result.bs_density.mu_opt
        );


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


// --------------------------------------------------
// OUTAGE CHART
// --------------------------------------------------

function drawOutageChart(results) {

    if (!outageCanvas) {

        console.error(
            "outageChart canvas was not found."
        );

        return;
    }


    destroyAllCharts();


    trafficFlowChartCard.classList.add("hidden");
    bsDensityChartCard.classList.add("hidden");

    if (outageChartCard) {
        outageChartCard.classList.remove("hidden");
    }


    const bsDensities =
        results.map(
            result =>
                result.bs_density
        );


    const outageProbabilities =
        results.map(
            result =>
                result.outage_probability * 100
        );


    const vehicleSpeed =
        results.length > 0
            ? results[0].vehicle_speed
            : 0;


    outageChart = new Chart(
        outageCanvas,
        {
            type: "line",

            data: {

                labels: bsDensities,

                datasets: [
                    {
                        label:
                            `Outage Probability at ${vehicleSpeed} m/s`,

                        data:
                            outageProbabilities,

                        borderWidth: 2,

                        pointRadius: 3,

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
                            "Outage Probability vs BS Density"
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
                                "BS Density (BS/m)"
                        }

                    },

                    y: {

                        title: {
                            display: true,
                            text:
                                "Outage Probability (%)"
                        },

                        beginAtZero: true,

                        max: 100

                    }

                }

            }

        }
    );


    chartsSection.classList.remove("hidden");

}


// --------------------------------------------------
// DESTROY OLD CHARTS
// --------------------------------------------------

function destroyAllCharts() {

    if (trafficFlowChart) {

        trafficFlowChart.destroy();

        trafficFlowChart = null;

    }


    if (bsDensityChart) {

        bsDensityChart.destroy();

        bsDensityChart = null;

    }


    if (outageChart) {

        outageChart.destroy();

        outageChart = null;

    }

}


// --------------------------------------------------
// GENERATE THESIS PLOTS
// --------------------------------------------------

thesisPlotButton.addEventListener(
    "click",
    async () => {

        loading.classList.remove("hidden");

        metricsSection.classList.add("hidden");
        responseSection.classList.add("hidden");


        try {

            const response = await fetch(
                "http://127.0.0.1:8000/sweep",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        start_threshold:
                            900000000,

                        end_threshold:
                            1100000000,

                        num_points:
                            100,

                        path_loss_exponents:
                            [2, 3, 4]
                    })
                }
            );


            if (!response.ok) {

                throw new Error(
                    `Sweep request failed: ${response.status}`
                );

            }


            const data =
                await response.json();


            drawMultiAlphaCharts(
                data.results
            );


        } catch (error) {

            console.error(error);

            alert(
                "Could not generate thesis plots."
            );


        } finally {

            loading.classList.add("hidden");

        }

    }
);


// --------------------------------------------------
// MULTI-ALPHA THESIS CHARTS
// --------------------------------------------------

function drawMultiAlphaCharts(
    resultsByAlpha
) {

    destroyAllCharts();


    trafficFlowChartCard.classList.remove("hidden");
    bsDensityChartCard.classList.remove("hidden");

    if (outageChartCard) {
        outageChartCard.classList.add("hidden");
    }


    const alphaValues =
        Object.keys(resultsByAlpha);


    const trafficDatasets = [];
    const bsDensityDatasets = [];

    let thresholds = [];


    alphaValues.forEach(alpha => {

        const results =
            resultsByAlpha[alpha]
                .filter(
                    result =>
                        result.feasible
                );


        if (thresholds.length === 0) {

            thresholds =
                results.map(
                    result =>
                        result.inputs
                            .data_rate_threshold
                        / 1e6
                );

        }


        const trafficFlows =
            results.map(
                result =>
                    result.traffic
                        .traffic_flow
            );


        const bsDensities =
            results.map(
                result =>
                    result.bs_density
                        .mu_opt
            );


        trafficDatasets.push({
            label:
                `alpha = ${alpha}`,

            data:
                trafficFlows,

            borderWidth:
                2,

            pointRadius:
                0,

            tension:
                0
        });


        bsDensityDatasets.push({
            label:
                `alpha = ${alpha}`,

            data:
                bsDensities,

            borderWidth:
                2,

            pointRadius:
                0,

            tension:
                0
        });

    });


    trafficFlowChart =
        new Chart(
            trafficFlowCanvas,
            {
                type: "line",

                data: {

                    labels:
                        thresholds,

                    datasets:
                        trafficDatasets

                },

                options: {

                    responsive:
                        true,

                    plugins: {

                        title: {
                            display:
                                true,

                            text:
                                "Traffic Flow vs Data Rate Threshold"
                        },

                        legend: {
                            display:
                                true
                        }

                    },

                    scales: {

                        x: {

                            title: {
                                display:
                                    true,

                                text:
                                    "Data Rate Threshold (Mbps)"
                            }

                        },

                        y: {

                            title: {
                                display:
                                    true,

                                text:
                                    "Traffic Flow (vehicles/s)"
                            }

                        }

                    }

                }

            }
        );


    bsDensityChart =
        new Chart(
            bsDensityCanvas,
            {
                type: "line",

                data: {

                    labels:
                        thresholds,

                    datasets:
                        bsDensityDatasets

                },

                options: {

                    responsive:
                        true,

                    plugins: {

                        title: {
                            display:
                                true,

                            text:
                                "Optimal BS Density vs Data Rate Threshold"
                        },

                        legend: {
                            display:
                                true
                        }

                    },

                    scales: {

                        x: {

                            title: {
                                display:
                                    true,

                                text:
                                    "Data Rate Threshold (Mbps)"
                            }

                        },

                        y: {

                            title: {
                                display:
                                    true,

                                text:
                                    "Optimal BS Density (BS/m)"
                            }

                        }

                    }

                }

            }
        );


    chartsSection.classList.remove(
        "hidden"
    );

}