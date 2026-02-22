"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateForm = void 0;
const validateForm = ({ data, schema }) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.issues.reduce((acc, issue) => {
      // Join nested field paths like 'user.email'
      const fieldPath = issue.path.join(".");
      if (fieldPath) acc[fieldPath] = issue.message;
      return acc;
    }, {});
    return errors;
  }
  return null;
};
exports.validateForm = validateForm;
