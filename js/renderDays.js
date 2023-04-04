// --------------- Constants ---------------

const MARGINS = { top: 25, right: 50, bottom: 25, left: 5 };
const HEIGHT = 220;
const HORIZONTAL_OFFSET = 50;
const SQUARE_LENGTH = 30;
const DAYS = ["Su", "M", "Tu", "W", "Th", "F", "Sa"];

// --------------- Helper Functions ---------------
export const updateDayBorder = (day) => {
  const svg = d3.select(`rect[data-day="${day}"]`);
  // If the day is already selected, unselect it
  if (svg.attr("stroke") === "lightgreen") {
    svg.attr("stroke", "black");
  } else {
    svg.attr("stroke", "lightgreen");
  }
};

// --------------- Prep SVG ---------------
const renderDays = ({ tripsByDay, selectDayCallback }) => {
  const svg = d3
    .select("#day-container")
    .append("svg")
    .attr("width", 7 * HORIZONTAL_OFFSET)
    .attr("height", HEIGHT);
  const MAX_TRIP_DAY = Math.max(...tripsByDay.values());
  let MEAN_TRIP_DAY = 0;
  tripsByDay.forEach((val) => {
    MEAN_TRIP_DAY += val;
  });
  MEAN_TRIP_DAY /= tripsByDay.size;
  const MIN_TRIP_DAY = Math.min(...tripsByDay.values());
  const color = d3
    .scaleLinear()
    .domain([MIN_TRIP_DAY, MAX_TRIP_DAY])
    .range(["white", "blue"]);

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
      .attr("width", SQUARE_LENGTH)
      .attr("height", SQUARE_LENGTH)
      .attr("stroke", "black")
      .attr("stroke-width", 4)
      .attr("fill", color(tripsByDay.get(i)))
      .attr("data-day", i)
      .style("cursor", "pointer")
      .on("click", (_e) => {
        selectDayCallback(i);
      });
    // add smaller rect in top right corner of rect
    svg
      .append("rect")
      .attr(
        "x",
        (numericalDayOfWeek % 7) * HORIZONTAL_OFFSET + MARGINS.left - 2
      )
      .attr("y", Math.floor(numericalDayOfWeek / 7) * 40 + MARGINS.top - 2)
      .attr("width", SQUARE_LENGTH / 2)
      .attr("height", SQUARE_LENGTH / 2)
      .attr("fill", "rgb(235, 235, 235)")
      .style("cursor", "pointer")
      .on("click", (_e) => {
        selectDayCallback(i);
      });

    // add text to smaller rect
    svg
      .append("text")
      .html(i)
      .attr(
        "x",
        (numericalDayOfWeek % 7) * HORIZONTAL_OFFSET +
          MARGINS.left +
          (i > 9 ? -1 : 3)
      )
      .attr("y", Math.floor(numericalDayOfWeek / 7) * 40 + MARGINS.top + 10)
      .attr("font-size", "12px")
      .attr("fill", "black")
      .style("cursor", "pointer")
      .on("click", (_e) => {
        selectDayCallback(i);
      });
  }
};

export default renderDays;
