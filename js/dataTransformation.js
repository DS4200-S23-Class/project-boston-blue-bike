export const projectCoordinates = (
  locations,
  projection,
  latitudeKey = "Latitude",
  longitudeKey = "Longitude"
) => {
  return locations.map((location) => {
    const [x, y] = projection([location[longitudeKey], location[latitudeKey]]);
    return { ...location, projectedLongitude: x, projectedLatitude: y };
  });
};

// Assumes matrices are all of equal size and matrices are square
export const mergeMatrices = (...matrices) => {
  if (matrices.length === 1) return matrices[0];
  const result = matrices[0];
  result.forEach((row, i) =>
    Object.keys(row).forEach((col) => {
      if (col === "from_station") return;
      row[col] =
        parseInt(row[col]) +
        matrices
          .slice(1)
          .reduce((total, matrix) => total + parseInt(matrix[i][col]), 0);
    })
  );
  return result;
};
