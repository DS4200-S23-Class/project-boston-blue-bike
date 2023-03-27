import { getColAsObj, orderRow, mergeObj } from "./utils.js";

function renderMetadata(stationMatrix, stationName) {
  // Find index of station in stationMatrix
  const stationIndex = stationMatrix.findIndex(
    (_station) => _station["from_station"] === stationName
  );

  // Order stations by most trips from desired station
  const mostTripsFrom = orderRow(stationMatrix[stationIndex], stationName);

  // Order stations by most trips to desired station
  const stationCol = getColAsObj(stationMatrix, stationName);
  const mostTripsTo = orderRow(stationCol, stationName);

  // Order stations by most total trips between the desired station
  const mostTrips = orderRow(mergeObj(stationCol, stationMatrix[stationIndex]));
}

export default renderMetadata;
