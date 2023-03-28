import { getColAsObj, orderRow, mergeObj } from "./utils.js";
import { renderConnections, clearConnectionsContainer } from "./renderMap.js";

// --------------- Constants ---------------
const MARGINS = { top: 10, right: 10, bottom: 20, left: 65 };
const HEIGHT = 640;
const WIDTH = 600;
const VIS_HEIGHT = HEIGHT - MARGINS.top - MARGINS.bottom;
const VIS_WIDTH = WIDTH - MARGINS.left - MARGINS.right;

function renderMetaDataContainer() {
  const svg = d3
    .select("#meta-container")
    .append("svg")
    .attr("height", HEIGHT)
    .attr("width", WIDTH)
    .attr("id", "meta-svg");

  svg.append("g").attr("id", "meta-bars");
  svg.append("g").attr("id", "meta-axis");
  d3.select("#meta-container")
    .append("div")
    .attr("id", "meta-tooltip")
    .attr("class", "tooltip");
}

function clearMetaDataContainer() {
  d3.select("#meta-bars").selectAll("*").remove();
  d3.select("#meta-axis").selectAll("*").remove();
}

export function characterizeMetadata(stationMatrix, stationName) {
  // Find index of station in stationMatrix
  const stationIndex = stationMatrix.findIndex(
    (_station) => _station["from_station"] === stationName
  );

  // Order stations by most trips from desired station
  const mostTripsFrom = orderRow(stationMatrix[stationIndex]);

  // Order stations by most trips to desired station
  const stationCol = getColAsObj(stationMatrix, stationName);
  const mostTripsTo = orderRow(stationCol);

  // Order stations by most total trips between the desired station
  const mostTrips = orderRow(mergeObj(stationCol, stationMatrix[stationIndex]));

  const renderBar = (tripArray, minCount) => {
    const data = tripArray.filter(
      ([name, count]) => parseInt(count) >= minCount && name !== stationName
    );

    const X_SCALE = d3
      .scaleBand()
      .domain(data.map(([name, _count]) => name))
      .range([0, VIS_WIDTH])
      .padding(0.5);

    const MAX_Y = d3.max(data, ([_name, count]) => parseInt(count));
    const Y_SCALE = d3.scaleLinear().domain([0, MAX_Y]).range([VIS_HEIGHT, 0]);

    const color = d3
      .scaleLinear()
      .domain([minCount, MAX_Y])
      .range(["rgb(27, 82, 175)", "rgb(215, 149, 91)"]);

    const axis = d3.select("#meta-axis");
    const bars = d3.select("#meta-bars");

    // Event handlers
    const mouseover = (e, d) => {
      const [name, count] = d;
      d3.select("#meta-tooltip")
        .style("opacity", 1)
        .style("left", `${e.pageX + 10}px`)
        .style("top", `${e.pageY + 10}px`)
        .html(`${name}: ${count}`);

      renderConnections(stationName, [name]);
    };

    const mouseleave = (_e, _d) => {
      d3.select("#meta-tooltip")
        .style("opacity", 0)
        .style("left", `0`)
        .style("top", `0`);

      clearConnectionsContainer();
    };

    const mousemove = (e, _d) => {
      d3.select("#meta-tooltip")
        .style("left", `${e.pageX + 10}px`)
        .style("top", `${e.pageY + 10}px`);
    };

    bars
      .selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", ([name, _count]) => X_SCALE(name) + MARGINS.left)
      .attr("y", ([_name, count]) => Y_SCALE(count) + MARGINS.top)
      .attr("width", X_SCALE.bandwidth())
      .attr("height", ([_name, count]) => VIS_HEIGHT - Y_SCALE(count))
      .attr("fill", ([_name, count]) => color(count))
      .on("mouseover", mouseover)
      .on("mouseleave", mouseleave)
      .on("mousemove", mousemove);

    axis
      .append("g")
      .attr(
        "transform",
        `translate(${MARGINS.left},${VIS_HEIGHT + MARGINS.top})`
      )
      .call(d3.axisBottom(X_SCALE).ticks(10))
      .attr("font-size", "0");

    axis
      .append("g")
      .attr("transform", `translate(${MARGINS.left},${MARGINS.top})`)
      .call(d3.axisLeft(Y_SCALE).ticks(10))
      .attr("font-size", "10px");
  };

  clearMetaDataContainer();
  renderBar(mostTrips, 20);
}

export default renderMetaDataContainer;
