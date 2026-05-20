// backend/src/utils/validation.js

function validateNumber(value, fieldName, allowNull = false) {
  if (allowNull && (value === null || value === undefined || value === "")) {
    return null;
  }
  const num = Number(value);
  if (isNaN(num)) {
    throw new Error(`${fieldName} debe ser un número válido`);
  }
  return num;
}

function validateString(value, fieldName, maxLength = 500, required = false) {
  if (!value || (typeof value === "string" && value.trim() === "")) {
    if (required) {
      throw new Error(`${fieldName} es requerido`);
    }
    return "";
  }
  if (typeof value !== "string") {
    throw new Error(`${fieldName} debe ser texto`);
  }
  if (value.length > maxLength) {
    throw new Error(`${fieldName} no puede exceder ${maxLength} caracteres`);
  }
  return value.trim();
}

function validateDate(value, fieldName, required = false) {
  if (!value) {
    if (required) {
      throw new Error(`${fieldName} es requerido`);
    }
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fieldName} debe ser una fecha válida`);
  }
  return value;
}

function validateEnum(value, fieldName, allowedValues, required = false) {
  if (!value) {
    if (required) {
      throw new Error(`${fieldName} es requerido`);
    }
    return null;
  }
  if (!allowedValues.includes(value)) {
    throw new Error(`${fieldName} debe ser uno de: ${allowedValues.join(", ")}`);
  }
  return value;
}

module.exports = {
  validateNumber,
  validateString,
  validateDate,
  validateEnum,
};