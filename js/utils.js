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

export const findMaxX = (data, numMax, val) => {
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
