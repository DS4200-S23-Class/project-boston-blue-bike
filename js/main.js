import renderDays, { updateDayBorder } from "./renderDays.js";
import {
  tripsByDay,
  getTripMatrix,
  getManyTripMatrices,
  blueBikeStations,
} from "./dataLoad.js";
import {
  debounce,
  getColAsObj,
  orderRow,
  mergeObj,
  orderRowAlphabetical,
  calcOffset,
} from "./utils.js";
import {
  characterizeBlueBikeStations,
  debouncedStationResize,
  filterBlueBikeStations,
  renderBlueBikeStations,
  renderBlueBikeStationsContainer,
  renderBostonRegions,
  renderMapContainer,
  resetBlueBikeStations,
  renderConnections,
  renderMapToolTip,
  clearConnectionsContainer,
} from "./renderMap.js";
import { projectCoordinates } from "./dataTransformation.js";
import renderMetaDataContainer, {
  characterizeMetadata,
  clearMetaDataContainer,
  highlightBar,
  configureMetadataControls,
  resetHighlight,
} from "./renderMetadata.js";

// ------ Constants ------
const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;
const PROJECTION = d3
  .geoMercator()
  .center([-71, 42.3601])
  .scale(90000)
  .translate([WIDTH / 4, HEIGHT / 2]);

// The brain of the visualization. Controls interactions across views and manages all of the state
const visController = async () => {
  // ------ State ------
  const selectedDays = [];
  let stationMatrix = await getTripMatrix("total");
  let zoomScale = 1;
  let selectedStationName = null;
  const projectedStations = projectCoordinates(
    blueBikeStations,
    PROJECTION,
    "latitude",
    "longitude"
  );
  let selectedStationData = projectedStations;
  let orderBy = "count";

  // Configure event handlers
  d3.select("#clear-selection").on("click", () => {
    selectedStationName = null;
    resetBlueBikeStations();
    clearMetaDataContainer();
  });

  d3.select("#order-by").on("click", () => {
    if (orderBy === "count") {
      orderBy = "name";
    } else {
      orderBy = "count";
    }
    const minCount = parseInt(d3.select("#meta-threshold-value").html());
    const stations = orderStationsByTripCountBetweenStations();
    characterizeMetadata({
      stationData: stations.filter(
        ([name, count]) => name !== selectedStationName && count >= minCount
      ),
      stationName: selectedStationName,
      overCallback: mouseEnterMetadataCallback,
    });
    d3.select("#order-by").text(`Order by: ${orderBy}`);
  });

  // Debounced function to recharacterize stations
  const reCharacterizeStations = debounce(async () => {
    selectedStationData =
      !!selectedDays && selectedDays.length > 0
        ? projectedStations.map((station) => {
            const totalTrips = selectedDays.reduce(
              (acc, day) => parseInt(station[`${day}_total_trips`]) + acc,
              0
            );
            return { ...station, total_trips: totalTrips };
          })
        : projectedStations;

    stationMatrix =
      !!selectedDays && selectedDays.length > 0
        ? await getManyTripMatrices(selectedDays)
        : await getTripMatrix("total");

    characterizeBlueBikeStations({
      stations: selectedStationData,
      selectStationCallback,
      mouseEnterStationCallback,
      mouseLeaveStationCallback,
      mouseMoveStationCallback,
      getSelectedStation: () => selectedStationName,
    });
    selectStationCallback(selectedStationName);
  }, 500);

  // ------ Helper ------

  const orderStationsByTripCountBetweenStations = () => {
    // Find index of station in stationMatrix
    const stationIndex = stationMatrix.findIndex(
      (_station) => _station["from_station"] === selectedStationName
    );
    // Get column of matrix as object
    const stationCol = getColAsObj(stationMatrix, selectedStationName);
    // Order stations by most total trips between the desired station
    if (orderBy === "count") {
      return orderRow(mergeObj(stationCol, stationMatrix[stationIndex]));
    } else {
      return orderRowAlphabetical(
        mergeObj(stationCol, stationMatrix[stationIndex])
      );
    }
  };

  // ------ Callbacks ------

  // Callback function for when a day is selected
  const selectDayCallback = async (day) => {
    // Update border of day to either selected or unselected
    updateDayBorder(day);

    // Add or remove selected day from array
    if (selectedDays.includes(day)) {
      selectedDays.splice(selectedDays.indexOf(day), 1);
    } else {
      selectedDays.push(day);
    }

    // Update the trip matrix
    reCharacterizeStations();
  };

  // Callback function for when metadata control is updated
  const changeMetadataControlCallback = (e, _d) => {
    const data = orderStationsByTripCountBetweenStations().filter(
      ([name, count]) =>
        parseInt(count) >= e.target.value && name !== selectedStationName
    );

    characterizeMetadata({
      stationData: data,
      stationName: selectedStationName,
      overCallback: mouseEnterMetadataCallback,
    });
    filterBlueBikeStations([
      selectedStationName,
      ...data.map(([name, _count]) => name),
    ]);
  };

  // Callback function for when a metadata bar is hovered
  const mouseEnterMetadataCallback = (hoveredStation) => {
    highlightBar(hoveredStation);
    renderConnections({
      startStation: selectedStationName,
      endStations: [hoveredStation],
      scaleValue: zoomScale,
    });
  };

  // Callback function for when a station is selected
  const selectStationCallback = (_selectedStationName) => {
    selectedStationName = _selectedStationName;
    if (!selectedStationName) return;

    d3.select(`circle[data-station-name="${selectedStationName}"]`).attr(
      "stroke",
      "orange"
    );
    d3.select("#selected-station-name").text(selectedStationName);

    // Order stations by most total trips between the desired station
    const stationsByTripCount = orderStationsByTripCountBetweenStations();

    const mean = Math.floor(
      d3.mean(stationsByTripCount, ([name, count]) =>
        name !== selectedStationName ? count : 0
      )
    );
    configureMetadataControls({
      selectedStationName,
      stationsByTripCount,
      changeCallback: changeMetadataControlCallback,
    });

    const data = stationsByTripCount.filter(
      ([name, count]) => parseInt(count) >= mean && name !== selectedStationName
    );
    characterizeMetadata({
      stationData: data,
      stationName: selectedStationName,
      overCallback: mouseEnterMetadataCallback,
    });
    filterBlueBikeStations([
      selectedStationName,
      ...data.map(([name, _count]) => name),
    ]);
  };

  const mouseEnterStationCallback = (d) => {
    highlightBar(d.name);

    if (selectedStationName && selectedStationName !== d.name) {
      renderConnections({
        startStation: selectedStationName,
        endStations: [d.name],
        scaleValue: zoomScale,
      });
    }
  };

  const mouseLeaveStationCallback = (_e, d) => {
    if (selectedStationName && selectedStationName !== d.name) {
      resetHighlight(d.name);
      clearConnectionsContainer();
    }
  };

  const mouseMoveStationCallback = (e, d) => {
    // position the tooltip and fill in information
    const count =
      selectedStationName && selectedStationName !== d.name
        ? d3.select(`rect[data-station="${d.name}"]`).data()[0][1]
        : selectedStationData.find((s) => s.name === d.name)["total_trips"];

    const formatStationToolTip = () => {
      if (selectedStationName && selectedStationName !== d.name) {
        return `<p class="tooltip__header">${
          d.name
        }</p><p class="tooltip__content"><span class="tooltip__highlight">${count}</span> trip${
          parseInt(count) !== 1 ? "s" : ""
        } between ${selectedStationName}</p>`;
      } else {
        return `<p class="tooltip__header">${
          d.name
        }</p><p class="tooltip__content"><span class="tooltip__highlight">${count}</span> total trip${
          parseInt(count) !== 1 ? "s" : ""
        }</p>`;
      }
    };

    let horizontalPosition = "right";
    if (selectedStationName) {
      const startStation = d3
        .select(`circle[data-station-name="${selectedStationName}"]`)
        .data()[0];
      const c = d3.select(`circle[data-station-name="${d.name}"]`).data()[0];

      const { offsetX } = calcOffset(
        startStation.projectedLongitude,
        startStation.projectedLatitude,
        c.projectedLongitude,
        c.projectedLatitude,
        1
      );
      horizontalPosition = offsetX >= 0 ? "right" : "left";
    }

    d3.select("#map-tooltip")
      .html(formatStationToolTip())
      .style("left", `${e.pageX + 30}px`)
      .style("top", `${e.pageY - 30}px`);

    if (horizontalPosition === "left") {
      const tooltipWidth = document.querySelector("#map-tooltip").offsetWidth;
      d3.select("#map-tooltip")
        .style("left", `${e.pageX - tooltipWidth - 10}px`)
        .style("top", `${e.pageY - 30}px`);
    }
  };

  // Callback function for when the map is zoomed
  const zoomCallback = (newScale) => {
    zoomScale = newScale;
    debouncedStationResize(zoomScale);
  };

  renderDays({ tripsByDay, selectDayCallback });
  renderMapContainer({ zoomCallback });
  renderBostonRegions({ projection: PROJECTION });
  renderBlueBikeStationsContainer();
  renderBlueBikeStations({
    scaleValue: zoomScale,
    stations: selectedStationData,
  });
  characterizeBlueBikeStations({
    stations: selectedStationData,
    selectStationCallback,
    mouseEnterStationCallback,
    mouseLeaveStationCallback,
    mouseMoveStationCallback,
    getSelectedStation: () => selectedStationName,
  });
  renderMapToolTip();
  renderMetaDataContainer();
};

visController();
