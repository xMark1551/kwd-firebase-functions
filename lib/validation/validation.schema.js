"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequiredFields = void 0;
const validateRequiredFields = (obj, requiredFields) => {
    const errors = {};
    requiredFields.forEach((field) => {
        if (!obj[field] || obj[field].toString().trim() === "") {
            errors[field] = `${field} is required`;
        }
    });
    return errors;
};
exports.validateRequiredFields = validateRequiredFields;
