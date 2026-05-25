import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const productSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  slug: z.string().min(3, 'Slug must be at least 3 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  categoryId: z.string().min(1, 'Category is required'),
  subcategoryId: z.string().optional().nullable(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  basePrice: z.number().min(0, 'Price must be positive'),
  // Product images are deprecated in favor of per-variant images; keep but do not require.
  // Keep the field required in the form type to satisfy react-hook-form typing.
  images: z.array(z.string().url('Invalid image URL')),
  variants: z
    .array(
      z.object({
        color: z.string().min(1, 'Color is required'),
        pattern: z.string().min(1, 'Pattern is required'),
        stock: z.number().min(0, 'Stock cannot be negative'),
        additionalPrice: z.number().min(0, 'Additional price cannot be negative'),
        sku: z.string().min(1, 'SKU is required'),
        images: z
          .array(z.string().url('Invalid image URL'))
          .min(1, 'At least one image is required for each variant'),
        isAvailable: z.boolean(),
      })
    )
    .min(1, 'At least one variant is required')
    .superRefine((variants, ctx) => {
      // Enforce uniqueness of (color, pattern) within a product.
      const seen = new Set<string>();
      variants.forEach((v, index) => {
        const key = `${String(v.color).trim().toLowerCase()}__${String(v.pattern).trim().toLowerCase()}`;
        if (seen.has(key)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Duplicate variant (color + pattern) is not allowed',
            path: [index, 'pattern'],
          });
        }
        seen.add(key);
      });
    }),
  isActive: z.boolean(),
})

export const orderSchema = z.object({
  customerName: z.string().min(2, 'Customer name is required'),
  customerPhone: z.string().regex(/^[0-9]{10}$/, 'Invalid phone number (10 digits required)'),
  customerEmail: z.string().email('Invalid email address'),
  deliveryAddress: z.string().min(10, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^[0-9]{6}$/, 'Invalid pincode (6 digits required)'),
  items: z.array(z.object({
    productId: z.string(),
    variantId: z.string(),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
  })).min(1, 'At least one item is required'),
  paymentMethod: z.enum(['upi', 'cod']),
  upiTransactionId: z.string().optional(),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type ProductFormData = z.infer<typeof productSchema>
export type OrderFormData = z.infer<typeof orderSchema>
