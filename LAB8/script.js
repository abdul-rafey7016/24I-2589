// Dimensions & Margins setup
const width = 600;
const height = 400;
const margin = { top: 40, right: 30, bottom: 60, left: 70 };
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

// Select SVG element
const svg = d3.select("#chart")
  .attr("width", width)
  .attr("height", height);

// Create container group with margins applied
const g = svg.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// X and Y Scales
const xScale = d3.scaleBand()
  .range([0, innerWidth])
  .padding(0.3);

const yScale = d3.scaleLinear()
  .range([innerHeight, 0]);

// Axis groups
const xAxisGroup = g.append("g")
  .attr("transform", `translate(0, ${innerHeight})`);

const yAxisGroup = g.append("g");

// Y-Axis Title Label
const yLabel = g.append("text")
  .attr("class", "axis-label")
  .attr("transform", "rotate(-90)")
  .attr("x", -innerHeight / 2)
  .attr("y", -50)
  .attr("text-anchor", "middle");

// Load CSV and render initial state
d3.csv("penguins.csv", d3.autoType).then(data => {

  // Function to render / update chart based on current mode
  function updateChart(groupByKey, metricKey, yAxisTitle, targetHighlight) {
    // Clean nulls and aggregate data
    const filtered = data.filter(d => d[groupByKey] && d[metricKey] != null);

    const aggregated = d3.rollups(
      filtered,
      v => d3.mean(v, d => d[metricKey]),
      d => d[groupByKey]
    );

    // Update Scales
    xScale.domain(aggregated.map(d => d[0]));
    yScale.domain([0, d3.max(aggregated, d => d[1]) * 1.1]);

    // Update Axes
    xAxisGroup.transition().duration(500).call(d3.axisBottom(xScale));
    yAxisGroup.transition().duration(500).call(d3.axisLeft(yScale));

    // Update Y-Axis Label
    yLabel.text(yAxisTitle);

    // Step 2 & 4: Highlight the answer (Target bar red, others steelblue)
    g.selectAll("rect")
      .data(aggregated, d => d[0])
      .join(
        enter => enter.append("rect")
          .attr("class", "bar")
          .attr("x", d => xScale(d[0]))
          .attr("y", innerHeight)
          .attr("width", xScale.bandwidth())
          .attr("height", 0)
          .attr("fill", d => d[0] === targetHighlight ? "red" : "steelblue"),
        update => update,
        exit => exit.remove()
      )
      .transition()
      .duration(500)
      .attr("x", d => xScale(d[0]))
      .attr("y", d => yScale(d[1]))
      .attr("width", xScale.bandwidth())
      .attr("height", d => innerHeight - yScale(d[1])) // Line deciding bar height
      .attr("fill", d => d[0] === targetHighlight ? "red" : "steelblue");
  }

  // Default View: Body Mass by Species (Gentoo highlighted)
  updateChart("species", "body_mass_g", "Mean Body Mass (g)", "Gentoo");

  // Button Listeners
  d3.select("#btn-body-mass").on("click", function() {
    setActiveButton(this);
    updateChart("species", "body_mass_g", "Mean Body Mass (g)", "Gentoo");
  });

  d3.select("#btn-flipper-length").on("click", function() {
    setActiveButton(this);
    // Step 3: Flipper Length by Species (Gentoo highlighted)
    updateChart("species", "flipper_length_mm", "Mean Flipper Length (mm)", "Gentoo");
  });

  d3.select("#btn-island-mass").on("click", function() {
    setActiveButton(this);
    // Step 4: Body Mass by Island (Biscoe highlighted)
    updateChart("island", "body_mass_g", "Mean Body Mass (g)", "Biscoe");
  });

  function setActiveButton(btn) {
    d3.selectAll("button").classed("active", false);
    d3.select(btn).classed("active", true);
  }

}).catch(error => {
  console.error("Error loading CSV:", error);
});