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
  renderBlueBikeStations,
  renderBlueBikeStationsContainer,
  renderBostonRegions,
  renderMapContainer,
} from "./renderMap.js";
import { projectCoordinates } from "./dataTransformation.js";

// ------ Constants ------
const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;
const PROJECTION = d3
  .geoMercator()
  .center([-71, 42.3601])
  .scale(90000)
  .translate([WIDTH / 4, HEIGHT / 2]);

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
      stationMatrix,
    });
  }, 500);

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

  // TODO
  const selectStationCallback = (station) => {
    selectedStationName = station;
    d3.select("#select-text").attr("class", "no-display");
    d3.select("#controls").attr("class", "");
    // STEP 1 - Aggregate the data
    // Find index of station in stationMatrix
    const stationIndex = stationMatrix.findIndex(
      (_station) => _station["from_station"] === selectedStationName
    );
    const stationCol = getColAsObj(stationMatrix, selectedStationName);
    // Order stations by most total trips between the desired station
    const mostTrips = orderRow(
      mergeObj(stationCol, stationMatrix[stationIndex])
    );
    // STEP 2 - Find limits for the metadata threshold
    const mean = Math.floor(
      d3.mean(mostTrips, ([name, count]) =>
        name !== selectedStationName ? count : 0
      )
    );
    const max = Math.floor(
      d3.max(mostTrips, ([name, count]) =>
        name !== selectedStationName ? count : 0
      )
    );
    const data = mostTrips.filter(
      ([name, count]) => parseInt(count) >= mean && name !== selectedStationName
    );
    // STEP 3 - Configure the metadata threshold
    const metaInput = d3.select("#meta-threshold");
    d3.select("#meta-threshold-value").text(mean);
    metaInput.property("value", mean);
    metaInput.property("max", max);
    metaInput.property("min", 1);
    metaInput.on("input", (e, _d) => {
      d3.select("#meta-threshold-value").text(e.target.value);
    });
    metaInput.on("change", (e, _d) => {
      const data = mostTrips.filter(
        ([name, count]) =>
          parseInt(count) >= e.target.value && name !== selectedStationName
      );
      characterizeMetadata(data, selectedStationName);
      filterBlueBikeStations([
        selectedStationName,
        ...data.map(([name, _count]) => name),
      ]);
    });
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
    stationMatrix,
    selectStationCallback,
  });
};

visController();
