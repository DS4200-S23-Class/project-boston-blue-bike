import { clearConnectionsContainer } from "./renderMap.js";

// --------------- Constants ---------------
const MARGINS = { top: 10, right: 10, bottom: 20, left: 65 };
const HEIGHT = window.innerHeight - window.innerHeight * 0.4;
const WIDTH = (window.innerWidth - window.innerWidth * 0.3) / 2;
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

export function clearMetaDataContainer() {
  d3.select("#meta-bars").selectAll("*").remove();
  d3.select("#meta-axis").selectAll("*").remove();
}

export function characterizeMetadata({
  stationData,
  stationName,
  overCallback,
}) {
  clearMetaDataContainer();

  const data = stationData.filter(([name, _count]) => name !== stationName);

  const X_SCALE = d3
    .scaleBand()
    .domain(data.map(([name, _count]) => name))
    .range([0, VIS_WIDTH])
    .padding(0.5);

  const MIN_Y = d3.min(data, ([name, count]) => parseInt(count));
  const MAX_Y = d3.max(data, ([name, count]) =>
    name !== stationName ? parseInt(count) : 0
  );
  const Y_SCALE = d3.scaleLinear().domain([0, MAX_Y]).range([VIS_HEIGHT, 0]);

  const color = d3
    .scaleLinear()
    .domain([MIN_Y, MAX_Y])
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
    overCallback(name);
  };

  const mouseleave = (_e, d) => {
    d3.select("#meta-tooltip")
      .style("opacity", 0)
      .style("left", `0`)
      .style("top", `0`);

    clearConnectionsContainer();
    resetHighlight(d[0]);
  };

  const mousemove = (e, _d) => {
    d3.select("#meta-tooltip")
      .style("left", `${e.pageX + 10}px`)
      .style("top", `${e.pageY + 10}px`);
  };

  // Render the actual bars
  bars
    .selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", ([name, _count]) => X_SCALE(name) + MARGINS.left)
    .attr("y", ([_name, _count]) => HEIGHT - MARGINS.bottom)
    .attr("width", X_SCALE.bandwidth())
    .attr("height", ([_name, _count]) => 0)
    .attr("fill", ([_name, count]) => color(count))
    .attr("data-station", ([name, _count]) => name)
    .on("mouseover", mouseover)
    .on("mouseleave", mouseleave)
    .on("mousemove", mousemove)
    .transition()
    .duration(500)
    .attr("y", ([_name, count]) => Y_SCALE(count) + MARGINS.top)
    .attr("height", ([_name, count]) => VIS_HEIGHT - Y_SCALE(count));

  // Render the axis
  axis
    .append("g")
    .attr("transform", `translate(${MARGINS.left},${VIS_HEIGHT + MARGINS.top})`)
    .call(d3.axisBottom(X_SCALE).ticks(10))
    .attr("font-size", "0");

  axis
    .append("g")
    .attr("transform", `translate(${MARGINS.left},${MARGINS.top})`)
    .call(d3.axisLeft(Y_SCALE).ticks(10))
    .attr("font-size", "10px");
}

export function highlightBar(stationName) {
  d3.selectAll(`rect[data-station="${stationName}"]`)
    .transition()
    .duration(500)
    .attr("stroke", "red")
    .attr("stroke-width", 4);
}

export function resetHighlight(stationName) {
  d3.selectAll(`rect[data-station="${stationName}"]`)
    .transition()
    .duration(500)
    .attr("stroke", null);
}

export const configureMetadataControls = ({
  selectedStationName,
  stationsByTripCount,
  changeCallback,
}) => {
  d3.select("#select-text").attr("class", "no-display");
  d3.select("#controls").attr("class", "");

  // Find limits for the metadata threshold
  const mean = Math.floor(
    d3.mean(stationsByTripCount, ([name, count]) =>
      name !== selectedStationName ? count : 0
    )
  );
  const max = Math.floor(
    d3.max(stationsByTripCount, ([name, count]) =>
      name !== selectedStationName ? count : 0
    )
  );
  // Configure the metadata threshold
  const metaInput = d3.select("#meta-threshold");
  d3.select("#meta-threshold-value").text(mean);
  metaInput.property("value", mean);
  metaInput.property("max", max);
  metaInput.property("min", 1);
  metaInput.on("input", (e, _d) => {
    d3.select("#meta-threshold-value").text(e.target.value);
  });
  metaInput.on("change", (e, _d) => {
    changeCallback(e, _d);
  });
};

export default renderMetaDataContainer;
