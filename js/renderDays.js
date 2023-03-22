import { tripsByDay, getTripMatrix, getManyTripMatrices } from "./dataLoad.js";
import { debounce } from "./utils.js";
// --------------- Constants ---------------

const MARGINS = { top: 25, right: 50, bottom: 25, left: 100 };
const HORIZONTAL_OFFSET = 50;
const DAYS = ["Su", "M", "Tu", "W", "Th", "F", "Sa"];

// --------------- Prep SVG ---------------
const svg = d3
  .select("#day-container")
  .append("svg")
  .attr("width", "100%")
  .attr("height", "100%");

const renderDays = () => {
  const MAX_TRIP_DAY = Math.max(...tripsByDay.values());
  let MEAN_TRIP_DAY = 0;
  tripsByDay.forEach((val) => {
    MEAN_TRIP_DAY += val;
  });
  MEAN_TRIP_DAY /= tripsByDay.size;
  const MIN_TRIP_DAY = Math.min(...tripsByDay.values());
  const color = d3
    .scaleLinear()
    .domain([MIN_TRIP_DAY, MEAN_TRIP_DAY, MAX_TRIP_DAY])
    .range(["blue", "white", "red"]);
  const selectedDays = [];

  const selectDay = debounce(async () => {
    const matrix =
      !!selectedDays && selectedDays.length > 0
        ? await getManyTripMatrices(selectedDays)
        : await getTripMatrix("total");

    d3.select("#boston-map").dispatch("selectday", {
      detail: { days: selectedDays, stationMatrix: matrix },
    });
  }, 500);

  DAYS.forEach((day, index) => {
    svg
      .append("text")
      .html(day)
      .attr("x", index * HORIZONTAL_OFFSET + MARGINS.left + 5)
      .attr("y", 20);
  });

  // Add rectangle to represent each day
  for (let i = 1; i < 31; i++) {
    let numericalDayOfWeek = i + 3;
    svg
      .append("rect")
      .attr("x", (numericalDayOfWeek % 7) * HORIZONTAL_OFFSET + MARGINS.left)
      .attr("y", Math.floor(numericalDayOfWeek / 7) * 40 + MARGINS.top)
      .attr("width", 30)
      .attr("height", 30)
      .attr("stroke", "black")
      .attr("stroke-width", 4)
      .attr("fill", color(tripsByDay.get(i)))
      .style("cursor", "pointer")
      .on("click", (e) => {
        const rect = e.target;
        if (selectedDays.includes(i)) {
          selectedDays.splice(
            selectedDays.findIndex((_i) => i === _i),
            1
          );
          rect.setAttribute("stroke", "black");
        } else {
          selectedDays.push(i);
          rect.setAttribute("stroke", "lightgreen");
        }
        selectDay();
      });
  }
};

export default renderDays;
