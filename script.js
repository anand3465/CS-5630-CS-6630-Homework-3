// Constants for the charts, that would be useful.
const CHART_WIDTH = 500;
const CHART_HEIGHT = 250;
const MARGIN = { left: 50, bottom: 20, top: 20, right: 20 };
const ANIMATION_DUATION = 300;

setup();

function setup () {
    const chartWidth = CHART_WIDTH - MARGIN.left - MARGIN.right;
    const chartHeight = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;

    // Set up the SVGs and groups for each chart
    d3.select("#Barchart-div").append("svg").attr("width", CHART_WIDTH).attr("height", CHART_HEIGHT)
        .append("g").attr("transform", `translate(${MARGIN.left},${MARGIN.top})`)
        .append("g").attr("class", "x-axis").attr("transform", `translate(0, ${chartHeight})`);
    d3.select("#Barchart-div g").append("g").attr("class", "y-axis");

    d3.select("#Linechart-div").append("svg").attr("width", CHART_WIDTH).attr("height", CHART_HEIGHT)
        .append("g").attr("transform", `translate(${MARGIN.left},${MARGIN.top})`)
        .append("g").attr("class", "x-axis").attr("transform", `translate(0, ${chartHeight})`);
    d3.select("#Linechart-div g").append("g").attr("class", "y-axis");

    d3.select("#Areachart-div").append("svg").attr("width", CHART_WIDTH).attr("height", CHART_HEIGHT)
        .append("g").attr("transform", `translate(${MARGIN.left},${MARGIN.top})`)
        .append("g").attr("class", "x-axis").attr("transform", `translate(0, ${chartHeight})`);
    d3.select("#Areachart-div g").append("g").attr("class", "y-axis");

    d3.select("#Scatterplot-div").append("svg").attr("width", CHART_WIDTH).attr("height", CHART_HEIGHT)
        .append("g").attr("transform", `translate(${MARGIN.left},${MARGIN.top})`)
        .append("g").attr("class", "x-axis").attr("transform", `translate(0, ${chartHeight})`);
    d3.select("#Scatterplot-div g").append("g").attr("class", "y-axis");

    // Set up event listeners and initial data load
    d3.select('#dataset').on('change', changeData);
    d3.select('#metric').on('change', changeData);
    d3.select('#random').on('change', changeData);

    changeData();  // Initial data load
}

/**
 * Render the visualizations
 * @param data
 */
function update (data) {
    const metric = d3.select('#metric').node().value;  // Get selected metric

    // Filter valid data
    const validData = data.filter(d => d.date != null && !isNaN(d[metric]));

    const yScaleLinear = d3.scaleLinear()
        .domain([0, d3.max(validData, d => d[metric])])  // Max value for the selected metric
        .range([CHART_HEIGHT - MARGIN.top - MARGIN.bottom, 0]);

    const xScaleBand = d3.scaleBand()
        .domain(validData.map(d => d.date))
        .range([0, CHART_WIDTH - MARGIN.left - MARGIN.right])
        .padding(0.1);

    // Scatter plot specific scales
    const xScaleCases = d3.scaleLinear()
        .domain([0, d3.max(validData, d => d.cases)])  // X is cases
        .range([0, CHART_WIDTH - MARGIN.left - MARGIN.right]);

    const yScaleDeaths = d3.scaleLinear()
        .domain([0, d3.max(validData, d => d.deaths)])  // Y is deaths
        .range([CHART_HEIGHT - MARGIN.top - MARGIN.bottom, 0]);

    // Call the individual update functions for each chart
    updateBarChart(validData, xScaleBand, yScaleLinear, metric);
    updateLineChart(validData, xScaleBand, yScaleLinear, metric);  // Line chart update
    updateAreaChart(validData, xScaleBand, yScaleLinear, metric);  // Area chart update
    updateScatterPlot(validData, xScaleCases, yScaleDeaths);  // Scatter plot update
}


/**
 * Update the bar chart 
 */
function updateBarChart(data, xScaleBand, yScaleLinear, metric) {
    const svg = d3.select("#Barchart-div").select("svg").select("g");
    const chartHeight = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;

    // Bind data to bars and render with transitions and interactivity
    const bars = svg.selectAll(".bar")
        .data(data);

    // Exit old bars with fading transition
    bars.exit()
        .transition()
        .duration(500)
        .attr("opacity", 0)  // Fade out old bars
        .remove();

    // Update existing bars and apply transition
    bars.transition()
        .duration(500)
        .ease(d3.easeCubic)
        .attr("x", d => xScaleBand(d.date))
        .attr("y", d => yScaleLinear(d[metric]))
        .attr("width", xScaleBand.bandwidth())
        .attr("height", d => chartHeight - yScaleLinear(d[metric]))
        .attr("fill", "rgb(79, 175, 211)")  // Ensure the fill color is blue (default color)
        .attr("opacity", 1);  // Ensure the opacity is 1 for the updated bars

    // Enter new bars with transitions and interactive hover effects
    bars.enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => xScaleBand(d.date))
        .attr("y", chartHeight)  // Start bars at the bottom of the chart
        .attr("width", xScaleBand.bandwidth())
        .attr("height", 0)  // Start with zero height
        .attr("fill", "rgb(79, 175, 211)")  // Set fill color for new bars
        .attr("opacity", 0)  // Start with opacity 0
        .on("mouseover", function() {
            d3.select(this).classed("hovered", true).attr("fill", "orange");  // Change color on hover
        })
        .on("mouseout", function() {
            d3.select(this).classed("hovered", false).attr("fill", "rgb(79, 175, 211)");  // Reset color on mouseout
        })
        .transition()
        .duration(500)
        .ease(d3.easeCubic)
        .attr("y", d => yScaleLinear(d[metric]))  // Animate to the correct y position
        .attr("height", d => chartHeight - yScaleLinear(d[metric]))  // Animate to the correct height
        .attr("opacity", 1);  // Fade in

    // Update axes
    svg.select(".x-axis")
    .call(d3.axisBottom(xScaleBand));
    svg.select(".y-axis")
    .call(d3.axisLeft(yScaleLinear));

}



/**
 * Update the line chart 
 */
function updateLineChart(data, xScaleTime, yScaleLinear, metric) {
    const svg = d3.select("#Linechart-div").select("svg").select("g");

    // Define the line generator
    const lineGenerator = d3.line()
        .x(d => xScaleTime(d.date))
        .y(d => yScaleLinear(d[metric]));

    // Remove previous line
    svg.selectAll(".line-chart").remove();

    // Append new line path
    const path = svg.append("path")
        .datum(data)
        .attr("class", "line-chart")
        .attr("fill", "none")
        .attr("stroke", "rgb(79, 175, 211)")
        .attr("stroke-width", 2)
        .attr("d", lineGenerator);

    // Get the total length of the path
    const totalLength = path.node().getTotalLength();

    // Set up the line drawing transition
    path
        .attr("stroke-dasharray", totalLength + " " + totalLength)  // Create dashes with the total length of the line
        .attr("stroke-dashoffset", totalLength)  // Offset the dash by the total length (hides the line)
        .transition()  // Start the transition
        .duration(1500)  // Set duration for the drawing effect
        .ease(d3.easeLinear)  // Use linear easing for smooth drawing
        .attr("stroke-dashoffset", 0);  // Animate the dash offset to 0 (draws the line)

    // Update axes
    svg.select(".x-axis")
    .call(d3.axisBottom(xScaleTime));
    svg.select(".y-axis")
    .call(d3.axisLeft(yScaleLinear));
}



/**
 * Update the area chart 
 */
function updateAreaChart(data, xScaleTime, yScaleLinear, metric) {
    const svg = d3.select("#Areachart-div").select("svg").select("g");

    // Define the area generator
    const areaGenerator = d3.area()
        .x(d => xScaleTime(d.date))  // X coordinate is based on date
        .y1(d => yScaleLinear(d[metric]))  // Upper boundary is based on the selected metric
        .y0(CHART_HEIGHT - MARGIN.top - MARGIN.bottom);  // Bottom boundary is the base of the chart

    // Bind data to the area path
    const areaPath = svg.selectAll(".area-chart")
        .data([data]);

    // Exit old areas with fading transition
    areaPath.exit()
        .transition()
        .duration(500)
        .attr("opacity", 0)  // Fade out old area
        .remove();

    // Update existing area with transitions
    areaPath
        .transition()
        .duration(500)
        .ease(d3.easeCubic)
        .attr("d", areaGenerator)  // Update the path for the new data
        .attr("opacity", 1);

    // Enter new areas with transitions
    areaPath.enter()
        .append("path")
        .attr("class", "area-chart")
        .attr("d", areaGenerator)  // Initially set the path
        .attr("fill", "rgb(79, 175, 211)")  // Set fill color for the area
        .attr("opacity", 0)  // Start with opacity 0
        .transition()
        .duration(500)
        .ease(d3.easeCubic)
        .attr("opacity", 1);  // Fade in the new area

    // Update axes
    svg.select(".x-axis")
    .call(d3.axisBottom(xScaleTime));
    svg.select(".y-axis")
    .call(d3.axisLeft(yScaleLinear));
}


/**
 * Update the scatter plot 
 */
function updateScatterPlot(data, xScaleCases, yScaleDeaths) {
    const svg = d3.select("#Scatterplot-div").select("svg").select("g");

    // Bind data to dots
    const dots = svg.selectAll(".dot")
        .data(data);

    // Exit old dots with fade out transition
    dots.exit()
        .transition()
        .duration(500)
        .attr("opacity", 0)
        .attr("r", 0)  // Shrink radius to 0
        .remove();

    // Update existing dots with transitions
    dots.transition()
        .duration(500)
        .ease(d3.easeCubic)
        .attr("cx", d => xScaleCases(d.cases))
        .attr("cy", d => yScaleDeaths(d.deaths))
        .attr("r", 5)
        .attr("fill", "rgb(79, 175, 211)")  // Set default color
        .attr("opacity", 1);

    // Enter new dots with hover and click interactivity
    dots.enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", d => xScaleCases(d.cases))
        .attr("cy", d => yScaleDeaths(d.deaths))
        .attr("r", 0)  // Start with radius 0
        .attr("fill", "rgb(79, 175, 211)")  // Set default color
        .attr("opacity", 0)  // Start with opacity 0
        .on("mouseover", function() {
            d3.select(this).attr("fill", "orange");  // Change color on hover
        })
        .on("mouseout", function() {
            d3.select(this).attr("fill", "rgb(79, 175, 211)");  // Reset color on mouseout
        })
        .on("click", function(event, d) {
            console.log("X (cases):", d.cases, "Y (deaths):", d.deaths);  // Log x and y values
        })
        .transition()
        .duration(500)
        .ease(d3.easeCubic)
        .attr("r", 5)  // Animate the radius to 5
        .attr("opacity", 1);  // Fade in the dot


         // Update x-axis and y-axis
    svg.select(".x-axis")
    .call(d3.axisBottom(xScaleCases));

    svg.select(".y-axis")
    .call(d3.axisLeft(yScaleDeaths));
}


/**
 * Update the data according to document settings
 */
function changeData () {
    const dataFile = d3.select('#dataset').property('value');

    d3.csv(`data/${dataFile}.csv`)
      .then(dataOutput => {
        const dataResult = dataOutput.map((d) => ({
            cases: parseInt(d.cases),
            deaths: parseInt(d.deaths),
            date: d3.timeFormat("%m/%d")(d3.timeParse("%d-%b")(d.date))
        }));
        
          
          if (document.getElementById('random').checked) {
              update(randomSubset(dataResult));
          } else {
              update(dataResult);
          }
      }).catch(e => {
          console.log(e);
          alert('Error');
      });
}


/**
 *  Slice out a random chunk of the provided in data
 *  @param data
 */
function randomSubset (data) {
  return data.filter((d) => Math.random() > 0.5);
}
