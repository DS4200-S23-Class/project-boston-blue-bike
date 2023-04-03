import renderDays, { updateDayBorder } from "./renderDays.js";
import {
  tripsByDay,
  getTripMatrix,
  getManyTripMatrices,
  blueBikeStations,
} from "./dataLoad.js";
import { debounce, getColAsObj, orderRow, mergeObj } from "./utils.js";
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

  // Configure event handlers
  d3.select("#clear-selection").on("click", () => {
    selectedStationName = null;
    resetBlueBikeStations();
    clearMetaDataContainer();
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
    });
    selectStationCallback(selectedStationName);
  }, 500);

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
  const changeMetadataControlCallback = (e, _d, stationsByTripCount) => {
    const data = stationsByTripCount.filter(
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

    // STEP 1 - Aggregate the data
    // Find index of station in stationMatrix
    const stationIndex = stationMatrix.findIndex(
      (_station) => _station["from_station"] === selectedStationName
    );
    const stationCol = getColAsObj(stationMatrix, selectedStationName);
    // Order stations by most total trips between the desired station
    const stationsByTripCount = orderRow(
      mergeObj(stationCol, stationMatrix[stationIndex])
    );

    const mean = Math.floor(
      d3.mean(stationsByTripCount, ([name, count]) =>
        name !== selectedStationName ? count : 0
      )
    );
    configureMetadataControls({
      selectedStationName,
      stationsByTripCount,
      changeCallback: (e, d) =>
        changeMetadataControlCallback(e, d, stationsByTripCount),
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
  });
  renderMapToolTip();
  renderMetaDataContainer();
};

visController();
