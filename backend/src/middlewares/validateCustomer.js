const CustomerForm = require('../models/CustomerForm');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{7,15}$/;
const URL_REGEX = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;

const validateCustomerData = async (req, res, next) => {
  try {
    const rawData = req.body.data || req.body;
    // Normalize data if passed directly
    const data = typeof rawData === 'object' && !Array.isArray(rawData) ? rawData : {};

    // Retrieve the active published form schema
    const activeForm = await CustomerForm.findOne({ status: 'published' }).sort({ version: -1 });

    if (!activeForm) {
      return res.status(400).json({
        success: false,
        message: 'No published customer form found. Please publish a form first.',
      });
    }

    const errors = {};
    const sanitizedData = {};

    // Validate only active fields
    for (const field of activeForm.fields) {
      if (!field.active) continue;

      const fieldName = field.name;
      const value = data[fieldName];
      const label = field.label || fieldName;
      const valConfig = field.validation || {};

      // 1. Required Check
      const isMissing = value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
      if (field.required && isMissing && field.type !== 'auto_number') {
        errors[fieldName] = `${label} is required`;
        continue;
      }

      // If value is not provided and not required, skip further checks
      if (isMissing) {
        sanitizedData[fieldName] = field.defaultValue !== undefined ? field.defaultValue : null;
        continue;
      }

      // 2. Type-specific checks
      switch (field.type) {
        case 'text':
        case 'textarea': {
          const strVal = String(value).trim();
          if (valConfig.minLength && strVal.length < valConfig.minLength) {
            errors[fieldName] = `${label} must be at least ${valConfig.minLength} characters`;
          }
          if (valConfig.maxLength && strVal.length > valConfig.maxLength) {
            errors[fieldName] = `${label} cannot exceed ${valConfig.maxLength} characters`;
          }
          if (valConfig.pattern) {
            try {
              const re = new RegExp(valConfig.pattern);
              if (!re.test(strVal)) {
                errors[fieldName] = `${label} has an invalid format`;
              }
            } catch (e) {
              console.warn(`Invalid regex pattern for field ${fieldName}:`, valConfig.pattern);
            }
          }
          sanitizedData[fieldName] = strVal;
          break;
        }

        case 'number':
        case 'currency': {
          const numVal = Number(value);
          if (isNaN(numVal)) {
            errors[fieldName] = `${label} must be a valid number`;
          } else {
            if (valConfig.min !== undefined && valConfig.min !== null && numVal < valConfig.min) {
              errors[fieldName] = `${label} must be at least ${valConfig.min}`;
            }
            if (valConfig.max !== undefined && valConfig.max !== null && numVal > valConfig.max) {
              errors[fieldName] = `${label} cannot exceed ${valConfig.max}`;
            }
            sanitizedData[fieldName] = numVal;
          }
          break;
        }

        case 'phone': {
          const phoneStr = String(value).trim();
          if (!PHONE_REGEX.test(phoneStr)) {
            errors[fieldName] = `${label} must be a valid phone number (at least 10 digits)`;
          }
          sanitizedData[fieldName] = phoneStr;
          break;
        }

        case 'email': {
          const emailStr = String(value).trim().toLowerCase();
          if (!EMAIL_REGEX.test(emailStr)) {
            errors[fieldName] = `${label} must be a valid email address`;
          }
          sanitizedData[fieldName] = emailStr;
          break;
        }

        case 'date':
        case 'datetime': {
          const d = new Date(value);
          if (isNaN(d.getTime())) {
            errors[fieldName] = `${label} must be a valid date`;
          } else {
            sanitizedData[fieldName] = String(value);
          }
          break;
        }

        case 'time': {
          sanitizedData[fieldName] = String(value);
          break;
        }

        case 'checkbox': {
          sanitizedData[fieldName] = Boolean(value);
          break;
        }

        case 'radio':
        case 'select': {
          const strVal = String(value).trim();
          const validOptions = (field.options || []).map((opt) => opt.value);
          if (validOptions.length > 0 && !validOptions.includes(strVal)) {
            errors[fieldName] = `Selected value for ${label} is not a valid option`;
          }
          sanitizedData[fieldName] = strVal;
          break;
        }

        case 'multiselect': {
          let arrVal = value;
          if (typeof value === 'string') {
            try { arrVal = JSON.parse(value); } catch (e) { arrVal = [value]; }
          }
          if (!Array.isArray(arrVal)) {
            errors[fieldName] = `${label} must be an array of selected options`;
          } else {
            const validOptions = (field.options || []).map((opt) => opt.value);
            const invalidItems = arrVal.filter((item) => validOptions.length > 0 && !validOptions.includes(item));
            if (invalidItems.length > 0) {
              errors[fieldName] = `${label} contains invalid selections: ${invalidItems.join(', ')}`;
            }
            sanitizedData[fieldName] = arrVal;
          }
          break;
        }

        case 'url': {
          const urlStr = String(value).trim();
          if (!URL_REGEX.test(urlStr)) {
            errors[fieldName] = `${label} must be a valid URL`;
          }
          sanitizedData[fieldName] = urlStr;
          break;
        }

        case 'auto_number': {
          sanitizedData[fieldName] = value;
          break;
        }

        default:
          sanitizedData[fieldName] = value;
          break;
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Customer form validation failed',
        errors,
      });
    }

    // Attach validated and sanitized data and active form version to request
    req.sanitizedCustomerData = sanitizedData;
    req.activeFormVersion = activeForm.version;
    next();
  } catch (error) {
    console.error('Customer validation middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error validating customer form',
      error: error.message,
    });
  }
};

module.exports = { validateCustomerData };
