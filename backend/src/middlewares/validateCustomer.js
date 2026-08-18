const CustomerForm = require('../models/CustomerForm');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
      let value = data[fieldName];
      const label = field.label || fieldName;
      const valConfig = field.validation || {};

      // Auto-assign defaults for common required fields if omitted
      if ((value === undefined || value === null || value === '') && req.method === 'POST') {
        if (fieldName === 'entryDate') {
          value = new Date().toISOString().split('T')[0];
        } else if (fieldName === 'status') {
          value = field.defaultValue || 'Newly Contacted';
        } else if (fieldName === 'customerType' && field.defaultValue) {
          value = field.defaultValue;
        } else if (field.defaultValue !== undefined && field.defaultValue !== null && field.defaultValue !== '') {
          value = field.defaultValue;
        }
      }

      // 1. Required Check
      const isMissing = value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);

      // On PUT (partial update), if field is undefined, skip validation and don't overwrite
      if (req.method === 'PUT' && value === undefined) {
        continue;
      }

      if (req.method === 'POST' && field.required && isMissing && field.type !== 'auto_number') {
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
          const cleanDigits = phoneStr.replace(/[^0-9]/g, '');
          if (cleanDigits.length < 10) {
            errors[fieldName] = `${label} must be a valid phone number (at least 10 digits)`;
          }
          sanitizedData[fieldName] = phoneStr;
          break;
        }

        case 'email': {
          const emailStr = String(value).trim().toLowerCase();
          if (emailStr && !EMAIL_REGEX.test(emailStr)) {
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
            sanitizedData[fieldName] = String(value).substring(0, 10);
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
          const opts = field.options || [];
          // Match by value or label (case-insensitive)
          const matched = opts.find(
            (opt) =>
              String(opt.value).toLowerCase() === strVal.toLowerCase() ||
              String(opt.label).toLowerCase() === strVal.toLowerCase()
          );

          if (opts.length > 0 && !matched) {
            // If field is not required and value was empty or '-- Select --', clear it
            if (!field.required && (!strVal || strVal.startsWith('--'))) {
              sanitizedData[fieldName] = '';
            } else {
              // Accept value anyway or use first option if required
              sanitizedData[fieldName] = strVal;
            }
          } else {
            sanitizedData[fieldName] = matched ? matched.value : strVal;
          }
          break;
        }

        case 'multiselect': {
          let arrVal = value;
          if (typeof value === 'string') {
            try {
              arrVal = JSON.parse(value);
            } catch (e) {
              arrVal = value.split(',').map((s) => s.trim()).filter(Boolean);
            }
          }
          if (!Array.isArray(arrVal)) {
            sanitizedData[fieldName] = [String(value)];
          } else {
            sanitizedData[fieldName] = arrVal;
          }
          break;
        }

        case 'url': {
          const urlStr = String(value).trim();
          if (urlStr && !URL_REGEX.test(urlStr)) {
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
      const errorSummary = Object.values(errors).join(', ');
      return res.status(400).json({
        success: false,
        message: `Customer validation failed: ${errorSummary}`,
        errors,
      });
    }

    // Preserve any custom or non-form dynamic fields passed in data
    for (const key of Object.keys(data)) {
      if (!(key in sanitizedData) && data[key] !== undefined) {
        sanitizedData[key] = data[key];
      }
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
