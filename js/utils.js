// Credit: https://www.freecodecamp.org/news/javascript-debounce-example/
/**
 * Basic debounce function.
 * Helpful for preventing expensive operations from occuring too often.
 * @param {function} func The function to be debounced
 * @param {number} timeout Amount of time to debounce (default 300)
 * @returns Function that takes the same parameters as func but debounced
 */
export const debounce = (func, timeout = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
};

/**
 * Scale a value based on the zoom's k
 * @param {number} k Current zoom value
 * @param {number} max Larget allowed value
 * @param {number} min Minimum allowed value
 * @returns Scaled value
 */
export const scaleZoom = (k, max, min) => {
  const res = max / k;
  return min === undefined ? res : Math.max(res, min);
};

/**
 * Offset the x and y value of a point based on a second point and radius
 * @param {number} x1 x coordinate of first point
 * @param {number} y1 y coordinate of first point
 * @param {number} x2 x coordinate of second point
 * @param {number} y2 y coordinate of second point
 * @param {number} r the amount to offset point 1 by
 * @returns the amount to offset the first point by
 */
export const calcOffset = (x1, y1, x2, y2, r) => {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const offsetX = Math.cos(ang) * r;
  const offsetY = Math.sin(ang) * r;
  return { offsetX, offsetY };
};

/**
 * Find the maximum value across multiple rows of columns
 *
 * @param {object} data The data to be parsed
 * @param {string[]} cols The string we want to find the max value of
 * @returns The maximum (numerical) value of the column
 */
export const maxColumn = (data, cols) => {
  return d3.max(data, (d) =>
    cols.reduce((total, col) => total + parseInt(d[`${col}_total_trips`]), 0)
  );
};

/**
 * Find the mean value across multiple rows of columns
 *
 * @param {object} data The data to be parsed
 * @param {string[]} cols The string we want to find the max value of
 * @returns The mean (numerical) value of the column
 */
export const meanColumn = (data, cols) => {
  return d3.mean(data, (d) =>
    cols.reduce((total, col) => total + parseInt(d[`${col}_total_trips`]), 0)
  );
};

export const findMaxRow = (data, numMax) => {
  const val = data["from_station"];
  return Object.entries(data)
    .filter(
      ([name, count]) =>
        name !== val && name !== "from_station" && parseInt(count) > 0
    )
    .sort(
      ([_nameA, tripsA], [_nameB, tripsB]) =>
        parseInt(tripsB) - parseInt(tripsA)
    )
    .slice(0, numMax)
    .map(([name, _count]) => name);
};

/**
 * Does the same thing as findMaxRow but returns the entire row
 */
export const orderRow = (data) => {
  const val = data["from_station"];
  return Object.entries(data)
    .filter(
      ([name, count]) =>
        name !== val && name !== "from_station" && parseInt(count) > 0
    )
    .sort(
      ([_nameA, tripsA], [_nameB, tripsB]) =>
        parseInt(tripsB) - parseInt(tripsA)
    );
};

/**
 * Does the same thing as findMaxRow but returns the entire row and sorts alphabetically
 */
export const orderRowAlphabetical = (data) => {
  const val = data["from_station"];
  return Object.entries(data)
    .filter(
      ([name, count]) =>
        name !== val && name !== "from_station" && parseInt(count) > 0
    )
    .sort(([nameA, _countA], [nameB, _countB]) => nameA.localeCompare(nameB));
};

/**
 * Convert the col of a 2D array into an object
 * @param {number[][]} data the data to convert
 * @param {string} col the column to convert
 * @returns the column as an object
 */
export const getColAsObj = (data, col) => {
  const res = {};
  data.map((d) => ({ name: d["from_station"], count: d[col] }));
  data.forEach((d) => {
    res[d["from_station"]] = d[col];
  });
  return res;
};

/**
 * Combine two objects together
 * @param {Object} obj1 the first object
 * @param {Object} obj2 the second object
 * @returns the combined object
 */
export const mergeObj = (obj1, obj2) => {
  const res = {};
  Object.keys(obj1).forEach((key) => {
    res[key] = parseInt(obj1[key]) + parseInt(obj2[key]);
  });
  Object.keys(obj2).forEach((key) => {
    if (res[key] === undefined) {
      res[key] = parseInt(obj2[key]);
    }
  });
  return res;
};

// Inspired by: https://gist.github.com/pnavarrc/20950640812489f13246
export const createScale = (container, mean, max) => {
  // Create the SVG element and set its dimensions.
  const SVG_WIDTH = 400;
  const SVG_HEIGHT = 60;
  const PADDING = 15;

  const RECT_WIDTH = SVG_WIDTH / 2;
  const RECT_HEIGHT = SVG_HEIGHT / 2;

  container.select('svg[data-container="scale"]').remove();

  const svg = container
    .append("svg")
    .attr("width", SVG_WIDTH)
    .attr("height", SVG_HEIGHT)
    .attr("data-container", "scale");

  // Create the svg:defs element and the main gradient definition.
  const svgDefs = svg.append("defs");

  const scaleRect = svgDefs.append("linearGradient").attr("id", "mainGradient");

  // Create the stops of the main gradient. Stops for beginning, mean, max values.
  // Mean stop is placed relative to the max
  scaleRect.append("stop").attr("stop-color", "blue").attr("offset", "0");

  scaleRect
    .append("stop")
    .attr("stop-color", "white")
    .attr("offset", mean / max);

  scaleRect.append("stop").attr("stop-color", "red").attr("offset", "1");

  // Use the gradient to set the shape fill, via CSS.
  svg
    .append("rect")
    .classed("filled", true)
    .attr("x", PADDING)
    .attr("y", PADDING)
    .attr("width", RECT_WIDTH)
    .attr("height", RECT_HEIGHT);

  const labelContainer = svg.append("g").attr("data-container", "value-labels");

  // Add key for beginning value
  labelContainer
    .append("line")
    .attr("x1", PADDING)
    .attr("y1", PADDING)
    .attr("x2", PADDING)
    .attr("y2", PADDING + 35)
    .attr("stroke", "black")
    .attr("stroke-width", 2);

  labelContainer
    .append("text")
    .html("0")
    .attr("x", PADDING - 5)
    .attr("y", PADDING + 45);

  // Add key for mean value
  labelContainer
    .append("line")
    .attr("x1", (mean / max) * RECT_WIDTH + PADDING)
    .attr("y1", PADDING)
    .attr("x2", (mean / max) * RECT_WIDTH + PADDING)
    .attr("y2", PADDING + 35)
    .attr("stroke", "black")
    .attr("stroke-width", 2);

  labelContainer
    .append("text")
    .html(Math.round(mean))
    .attr("x", (mean / max) * RECT_WIDTH + PADDING)
    .attr("y", PADDING + 45);

  // Add key for max value
  labelContainer
    .append("line")
    .attr("x1", RECT_WIDTH + PADDING)
    .attr("y1", PADDING)
    .attr("x2", RECT_WIDTH + PADDING)
    .attr("y2", PADDING + 35)
    .attr("stroke", "black")
    .attr("stroke-width", 2);

  labelContainer
    .append("text")
    .html(Math.round(max))
    .attr("x", RECT_WIDTH + PADDING)
    .attr("y", PADDING + 45);
};
