import { z } from 'zod';

/**
 * Item validation schema
 */
export const itemSchema = z.object({
  name_en: z.string().min(1, 'English name is required').max(255),
  name_ar: z.string().max(255).optional(),
  desc_en: z.string().max(1000).optional(),
  desc_ar: z.string().max(1000).optional(),
  category_id: z.string().optional().nullable(),
  price: z
    .number()
    .min(0, 'Price must be non-negative')
    .max(9999, 'Price is too high'),
  image_url: z.string().url('Invalid image URL').optional().or(z.literal('')),
  has_combo: z.boolean().default(false),
  combo_price: z
    .number()
    .min(0, 'Combo price must be non-negative')
    .optional()
    .nullable(),
  combo_desc_en: z.string().max(500).optional(),
  combo_desc_ar: z.string().max(500).optional(),
  available: z.boolean().default(true),
  rating: z.number().min(0).max(5).optional(),
});

/**
 * Category validation schema
 */
export const categorySchema = z.object({
  name_en: z.string().min(1, 'English name is required').max(255),
  name_ar: z.string().max(255).optional(),
  active: z.boolean().default(true),
  sort_order: z.number().int().nonnegative().optional(),
});

/**
 * Promo code validation schema
 */
export const promoCodeSchema = z.object({
  code: z
    .string()
    .min(3, 'Code must be at least 3 characters')
    .max(50, 'Code must be less than 50 characters')
    .toUpperCase(),
  discount_type: z.enum(['percentage', 'fixed']),
  discount_value: z
    .number()
    .min(0, 'Discount must be non-negative')
    .max(100, 'Discount is too high'),
  max_uses: z
    .number()
    .int()
    .min(1, 'Max uses must be at least 1')
    .optional()
    .nullable(),
  active: z.boolean().default(true),
  expires_at: z
    .string()
    .datetime()
    .optional()
    .nullable(),
});

/**
 * Validate data against schema
 * @param {object} schema - Zod schema
 * @param {object} data - Data to validate
 * @returns {{success: boolean, data?: object, errors?: object}}
 */
export function validateData(schema, data) {
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: error.message } };
  }
}

/**
 * Sanitize string input
 * @param {string} input - Input string
 * @returns {string} Sanitized string
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>]/g, '') // Remove angle brackets
    .substring(0, 1000); // Limit length
}

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {boolean}
 */
export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
