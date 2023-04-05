// --------------- Constants ---------------

const MARGINS = { top: 25, right: 50, bottom: 25, left: 5 };
const HEIGHT = 220;
const HORIZONTAL_OFFSET = 50;
const SQUARE_LENGTH = 30;
const DAYS = ["Su", "M", "Tu", "W", "Th", "F", "Sa"];

// --------------- Helper Functions ---------------
export const updateDayBorder = (day) => {
  const container = d3.select(`rect[data-day="${day}"]`);
  const containerSmall = d3.select(`rect[data-day-small="${day}"]`);
  const containerText = d3.select(`text[data-day-text="${day}"]`);

  // If the day is already selected, unselect it
  if (container.attr("stroke") === "lightgreen") {
    container.attr("stroke", "black");
    containerSmall.attr("fill", "black");
    containerText.attr("fill", "white");
  } else {
    container.attr("stroke", "lightgreen");
    containerSmall.attr("fill", "lightgreen");
    containerText.attr("fill", "black");
  }
};

// --------------- Prep SVG ---------------
const renderDays = ({ tripsByDay, selectDayCallback }) => {
  const svg = d3
    .select("#day-container")
    .append("svg")
    .attr("width", 7 * HORIZONTAL_OFFSET)
    .attr("height", HEIGHT);
  const dayToolTip = d3
    .select("#day-container")
    .append("div")
    .attr("id", "day-tooltip")
    .attr("class", "tooltip");
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
    .range(["white", "darkorange"]);

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
      .on("mouseenter", (e) => {
        dayToolTip
          .style("opacity", 1)
          .style("left", `${e.pageX + 10}px`)
          .style("top", `${e.pageY - 10}px`)
          .html(`${tripsByDay.get(i)} trips on Sept. ${i}`);
      })
      .on("mousemove", (e) => {
        dayToolTip
          .style("left", `${e.pageX + 10}px`)
          .style("top", `${e.pageY - 10}px`);
      })
      .on("mouseleave", (_e) => {
        dayToolTip.style("opacity", 0).style("left", "0px").style("top", "0px");
      })
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
      .attr("fill", "black")
      .attr("data-day-small", i)
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
      .attr("fill", "white")
      .attr("data-day-text", i)
      .style("cursor", "pointer")
      .on("click", (_e) => {
        selectDayCallback(i);
      });
  }
};

export default renderDays;
