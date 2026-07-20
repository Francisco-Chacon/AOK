export const validate = (fields, lang) => {
  const errors = {};
  const t = (key) => {
    const translations = {
      es: {
        required: "Este campo es requerido",
        invalid_phone: "Formato inválido. Solo números y guiones",
        invalid_date: "Fecha inválida",
        date_after: "La fecha de fin debe ser posterior a la de inicio",
        invalid_email: "Email inválido",
        invalid_amount: "El monto debe ser mayor a 0",
        at_least_one: "Debe agregar al menos un elemento",
      },
      en: {
        required: "This field is required",
        invalid_phone: "Invalid format. Numbers and hyphens only",
        invalid_date: "Invalid date",
        date_after: "End date must be after start date",
        invalid_email: "Invalid email",
        invalid_amount: "Amount must be greater than 0",
        at_least_one: "Add at least one item",
      },
    };
    return translations[lang]?.[key] || translations.es[key];
  };

  fields.forEach(({ name, value, rules, label }) => {
    const fieldErrors = [];
    rules.forEach((rule) => {
      if (rule === "required" && (!value || (typeof value === "string" && !value.trim()))) {
        fieldErrors.push(t("required"));
      }
      if (rule === "phone" && value && !/^[\d\-\+\(\)\s]+$/.test(value)) {
        fieldErrors.push(t("invalid_phone"));
      }
      if (rule === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        fieldErrors.push(t("invalid_email"));
      }
      if (rule === "amount" && (value === "" || Number(value) <= 0)) {
        fieldErrors.push(t("invalid_amount"));
      }
    });
    if (fieldErrors.length) errors[name] = fieldErrors;
  });
  return errors;
};

export const validateDates = (startDate, endDate, lang) => {
  if (!startDate || !endDate) return null;
  const s = new Date(startDate);
  const e = new Date(endDate);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;
  if (e < s) {
    const msgs = { es: "La fecha de fin debe ser posterior a la de inicio", en: "End date must be after start date" };
    return msgs[lang] || msgs.es;
  }
  return null;
};
