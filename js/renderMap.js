import { projectCoordinates } from "./dataTransformation.js";
import {
  geoJson,
  blueBikeStations,
  getTripMatrix,
  getManyTripMatrices,
} from "./dataLoad.js";
import {
  debounce,
  scaleZoom,
  calcOffset,
  maxColumn,
  findMaxX,
  meanColumn,
  createScale,
} from "./utils.js";

// --------------- Constants ---------------
const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;
const ZOOM_THRESHOLD = [1, 7];
const MAX_STATION_SIZE = 3;
const MIN_STATION_SIZE = 1.25;

let GLOBAL_K = 1;

// --------------- Event handlers ---------------
const debouncedStationResize = debounce((zoomScale) => {
  d3.select('g[data-container="stations"]')
    .selectAll("circle")
    .transition()
    .duration(300)
    .attr("r", scaleZoom(zoomScale, MAX_STATION_SIZE, MIN_STATION_SIZE));
}, 400);

const zoomHandler = (e) => {
  g.attr("transform", e.transform);
  GLOBAL_K = e.transform.k;
  debouncedStationResize(GLOBAL_K);
};

const zoom = d3.zoom().scaleExtent(ZOOM_THRESHOLD).on("zoom", zoomHandler);

// --------------- Prep Map container ---------------
d3.select("#boston-map").on("selectday", (e) => {
  clearConnectionsContainer();
  characterizeBlueBikeStations(e.detail.days);
});

// --------------- Prep SVG ---------------
const svg = d3
  .select("#boston-map")
  .append("svg")
  .attr("width", "100%")
  .attr("height", "100%");

const g = svg.call(zoom).append("g");

// Align projection
const projection = d3
  .geoMercator()
  .center([-71.0589, 42.3601])
  .scale(90000)
  .translate([WIDTH / 4, HEIGHT / 2]);

const projectedStations = projectCoordinates(
  blueBikeStations,
  projection,
  "latitude",
  "longitude"
);

// Calculate path for regions outlines
const path = d3.geoPath().projection(projection);

function renderBostonRegions() {
  // Draw regions of Boston area
  g.append("g")
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
function renderBlueBikeStationsContainer() {
  g.append("g").attr("data-container", "stations");
  g.append("g").attr("data-container", "connections");
}

// Add the individual stations as circles
function renderBlueBikeStations(scaleValue) {
  const stationContainer = d3.select('g[data-container="stations"]');
  stationContainer
    .selectAll("circle")
    .data(projectedStations)
    .enter()
    .append("circle")
    .attr("cx", (d) => d.projectedLongitude)
    .attr("cy", (d) => d.projectedLatitude)
    .attr("data-station-name", (d) => d.name)
    .attr("r", scaleZoom(scaleValue, MAX_STATION_SIZE, MIN_STATION_SIZE));
}

// Add the functionality to the stations (event handlers, color, etc.)
async function characterizeBlueBikeStations(days) {
  // Retrieve the proper matrix based on the days input
  // Matrix is formatted such that the row is the "from" station, column is the "to" station
  const matrix =
    !!days && days.length > 0
      ? await getManyTripMatrices(days)
      : await getTripMatrix("total");

  // Event handlers
  const mouseEnterStationHandler = (e, d) => {
    const stationNode = e.target;
    stationNode.parentNode.appendChild(stationNode);

    // Find the row in the station matrix that corresponds to the highlighted station
    const stationIndex = matrix.findIndex(
      (_station) => _station["from_station"] === d.name
    );

    // Get the corresponding row from the matrix and find the X most travelled to stations
    const stationRow = matrix[stationIndex];
    const mostTripStations = findMaxX(stationRow, 5, d.name);

    // Get reference to the HTML container for connection SVGs
    const connectionContainer = d3.select('g[data-container="connections"]');

    // Render a connection for each of the most visited stations
    mostTripStations.forEach((station) => {
      const c = d3.select(`circle[data-station-name="${station}"]`).data()[0];
      const { offsetX, offsetY } = calcOffset(
        d.projectedLongitude,
        d.projectedLatitude,
        c.projectedLongitude,
        c.projectedLatitude,
        d3.select("circle").attr("r")
      );
      connectionContainer
        .append("line")
        .style("stroke", "black")
        .attr("x1", d.projectedLongitude + offsetX)
        .attr("y1", d.projectedLatitude + offsetY)
        .attr("x2", d.projectedLongitude + offsetX)
        .attr("y2", d.projectedLatitude + offsetY)
        .transition()
        .duration(200)
        .attr("x2", c.projectedLongitude - offsetX)
        .attr("y2", c.projectedLatitude - offsetY);
    });

    // Add tooltip
    d3.select("#tooltip").style("opacity", 1);
  };

  const mouseLeaveStationHandler = (_e, _d) => {
    clearConnectionsContainer();
    d3.select("#tooltip")
      .style("opacity", 0)
      .style("left", `0`)
      .style("top", `0`);
  };

  const mouseMoveStationHandler = (e, d) => {
    // position the tooltip and fill in information
    d3.select("#tooltip")
      .html(`${d.name} Total trips: ${d["count"]}`)
      .style("left", `${e.pageX}px`)
      .style("top", `${e.pageY - 50}px`);
  };

  const MEAN_TRIPS =
    !!days && days.length > 0
      ? meanColumn(projectedStations, days)
      : d3.mean(projectedStations, (d) => parseInt(d["total_trips"]));

  const MAX_TRIPS =
    !!days && days.length > 0
      ? maxColumn(projectedStations, days)
      : d3.max(projectedStations, (d) => parseInt(d["total_trips"]));

  // const color = d3.scaleQuantize().domain([0, MAX_TRIPS]).range(coolScale);
  const color = d3
    .scaleLinear()
    .domain([0, MEAN_TRIPS, MAX_TRIPS])
    .range(["blue", "white", "red"]);

  // Add gradient scale
  createScale(svg, MEAN_TRIPS, MAX_TRIPS);

  const stationContainer = d3.select('g[data-container="stations"]');
  stationContainer
    .selectAll("circle")
    .each((d) => {
      d["count"] =
        !!days && days.length > 0
          ? days.reduce(
              (total, day) => total + parseInt(d[`${day}_total_trips`]),
              0
            )
          : d.total_trips;
    })
    .on("mouseenter", mouseEnterStationHandler)
    .on("mouseleave", mouseLeaveStationHandler)
    .on("mousemove", mouseMoveStationHandler)
    .transition()
    .duration(200)
    .attr("fill", (d) => color(d["count"]));
}

function clearConnectionsContainer() {
  const connectionContainer = d3.select('g[data-container="connections"]');
  connectionContainer.selectAll("line").remove();
}

function renderToolTip() {
  d3.select("#boston-map")
    .append("div")
    .attr("id", "tooltip")
    .style("opacity", 0);
}

// Draw neighborhoods of Boston
const renderMap = () => {
  renderBostonRegions();
  renderBlueBikeStationsContainer();
  renderBlueBikeStations(GLOBAL_K);
  characterizeBlueBikeStations([]);
  renderToolTip();
};

export default renderMap;
