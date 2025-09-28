export const validateDecimal = (value) => {
  const validFormat = /^\d+([,]\d*)?$/;
  return validFormat.test(value);
};
