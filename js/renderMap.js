import { geoJson } from "./dataLoad.js";
import { debounce, scaleZoom, calcOffset, createScale } from "./utils.js";

// --------------- Constants ---------------
const ZOOM_THRESHOLD = [1, 7];
const MAX_STATION_SIZE = 3;
const MIN_STATION_SIZE = 1.25;
const MAX_STATION_BORDER = 1;
const MIN_STATION_BORDER = 0.1;

// --------------- Event handlers ---------------
export const debouncedStationResize = debounce((zoomScale) => {
  d3.select('g[data-container="stations"]')
    .selectAll("circle")
    .transition()
    .duration(300)
    .attr("r", scaleZoom(zoomScale, MAX_STATION_SIZE, MIN_STATION_SIZE))
    .attr(
      "stroke-width",
      scaleZoom(zoomScale, MAX_STATION_BORDER, MIN_STATION_BORDER)
    );
}, 400);

export function renderMapContainer({ zoomCallback }) {
  const zoomHandler = (e) => {
    g.attr("transform", e.transform);
    zoomCallback(e.transform.k);
  };

  const zoom = d3.zoom().scaleExtent(ZOOM_THRESHOLD).on("zoom", zoomHandler);

  // --------------- Prep SVG ---------------
  const svg = d3
    .select("#boston-map")
    .append("svg")
    .attr("id", "boston-svg")
    .attr("width", "100%")
    .attr("height", "100%");

  const g = svg.call(zoom).append("g").attr("id", "svg-container");
}

export function renderBostonRegions({ projection }) {
  // Calculate path for regions outlines
  const path = d3.geoPath().projection(projection);
  // Draw regions of Boston area
  d3.select("#svg-container")
    .append("g")
    .selectAll("path")
    .data(geoJson.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", "#ddead1")
    .attr("stroke", "black")
    .attr("stroke-width", 0.5);
}

// Add the container for the blue bike stations and connections
export function renderBlueBikeStationsContainer() {
  const svgContainer = d3.select("#svg-container");
  svgContainer.append("g").attr("data-container", "stations");
  svgContainer.append("g").attr("data-container", "connections");
}

// Add the individual stations as circles
export function renderBlueBikeStations({ scaleValue, stations }) {
  const stationContainer = d3.select('g[data-container="stations"]');
  stationContainer
    .selectAll("circle")
    .data(stations)
    .enter()
    .append("circle")
    .attr("cx", (d) => d.projectedLongitude)
    .attr("cy", (d) => d.projectedLatitude)
    .attr("data-station-name", (d) => d.name)
    .attr("r", scaleZoom(scaleValue, MAX_STATION_SIZE, MIN_STATION_SIZE))
    .attr("stroke", "black")
    .attr(
      "stroke-width",
      scaleZoom(scaleValue, MAX_STATION_BORDER, MIN_STATION_BORDER)
    )
    .style("cursor", "pointer");
}

// Add the functionality to the stations (event handlers, color, etc.)
export const characterizeBlueBikeStations = async ({
  stations,
  selectStationCallback,
  mouseEnterStationCallback,
  mouseLeaveStationCallback,
  mouseMoveStationCallback,
}) => {
  // Event handlers
  const mouseEnterStationHandler = (e, d) => {
    const stationNode = e.target;
    stationNode.parentNode.appendChild(stationNode);

    // Add tooltip
    d3.select("#map-tooltip").style("opacity", 1);

    mouseEnterStationCallback(d);
  };

  const mouseClickStationHandler = (_e, d) => {
    d3.selectAll("circle").style("cursor", "default");

    selectStationCallback(d.name);
  };

  const mouseLeaveStationHandler = (_e, _d) => {
    d3.select("#map-tooltip")
      .style("opacity", 0)
      .style("left", `0`)
      .style("top", `0`);

    mouseLeaveStationCallback(_e, _d);
  };

  const mouseMoveStationHandler = (_e, _d) => {
    mouseMoveStationCallback(_e, _d);
  };

  const MEAN_TRIPS = d3.mean(stations, (d) => parseInt(d["total_trips"]));

  const MAX_TRIPS = d3.max(stations, (d) => parseInt(d["total_trips"]));

  const color = d3
    .scaleLinear()
    .domain([0, MEAN_TRIPS, MAX_TRIPS])
    .range(["blue", "white", "red"]);

  // Add gradient scale
  createScale(d3.select("#boston-svg"), MEAN_TRIPS, MAX_TRIPS);

  const stationContainer = d3.select('g[data-container="stations"]');
  stationContainer
    .selectAll("circle")
    .on("click", mouseClickStationHandler)
    .on("mouseenter", mouseEnterStationHandler)
    .on("mouseleave", mouseLeaveStationHandler)
    .on("mousemove", mouseMoveStationHandler)
    .transition()
    .duration(200)
    .attr("fill", (d) =>
      color(stations.find((s) => s.name === d.name)["total_trips"])
    );
};

export function resetBlueBikeStations() {
  const stationContainer = d3.select('g[data-container="stations"]');

  stationContainer
    .selectAll("circle")
    .classed("no-events", false)
    .transition()
    .duration(200)
    .attr("opacity", 1);

  d3.select("#controls").attr("class", "no-display");
  d3.selectAll("circle").style("cursor", "pointer");
}

export function filterBlueBikeStations(keepStations) {
  const stationContainer = d3.select('g[data-container="stations"]');

  stationContainer
    .selectAll("circle")
    .classed("no-events", (d) => !keepStations.includes(d.name))
    .transition()
    .duration(200)
    .attr("opacity", (d) => (keepStations.includes(d.name) ? 1 : 0))
    .transition();
}

export function renderConnections({ startStation, endStations, scaleValue }) {
  const connectionContainer = d3.select('g[data-container="connections"]');

  if (typeof startStation === "string") {
    startStation = d3
      .select(`circle[data-station-name="${startStation}"]`)
      .data()[0];
  }

  endStations.forEach((endStation) => {
    const c = d3.select(`circle[data-station-name="${endStation}"]`).data()[0];
    const { offsetX, offsetY } = calcOffset(
      startStation.projectedLongitude,
      startStation.projectedLatitude,
      c.projectedLongitude,
      c.projectedLatitude,
      scaleZoom(scaleValue, MAX_STATION_SIZE, MIN_STATION_SIZE)
    );
    connectionContainer
      .append("line")
      .style("stroke", "black")
      .attr("x1", startStation.projectedLongitude + offsetX)
      .attr("y1", startStation.projectedLatitude + offsetY)
      .attr("x2", startStation.projectedLongitude + offsetX)
      .attr("y2", startStation.projectedLatitude + offsetY)
      .transition()
      .duration(150)
      .attr("x2", c.projectedLongitude - offsetX)
      .attr("y2", c.projectedLatitude - offsetY);
  });
}

export function clearConnectionsContainer() {
  const connectionContainer = d3.select('g[data-container="connections"]');
  connectionContainer.selectAll("line").remove();
}

export function renderMapToolTip() {
  d3.select("#boston-map")
    .append("div")
    .attr("id", "map-tooltip")
    .attr("class", "tooltip")
    .style("opacity", 0);
}
