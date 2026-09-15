const normalize = (value) => {
  if (Array.isArray(value)) {
    return value.map(normalize);
  }

  if (value && typeof value === 'object') {
    const output = {};

    if (value._id && !value.id) {
      output.id = value._id;
    }

    Object.entries(value).forEach(([key, item]) => {
      if (key === '_id' || key === '__v') {
        return;
      }

      output[key] = normalize(item);
    });

    return output;
  }

  return value;
};

const serialize = (value) => {
  if (value === null || value === undefined) {
    return value;
  }

  return normalize(JSON.parse(JSON.stringify(value)));
};

module.exports = {
  serialize,
};
