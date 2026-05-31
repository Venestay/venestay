import { z } from 'zod';

export const directRequestSchema = z.object({
  startDate: z.string().min(1, 'Selecciona la fecha de entrada'),
  endDate: z.string().min(1, 'Selecciona la fecha de salida'),
  guestMessage: z
    .string()
    .min(20, 'Tu mensaje debe tener al menos 20 caracteres')
    .max(500, 'Máximo 500 caracteres'),
  guestsCount: z.coerce.number().min(1).max(20),
  paymentMethod: z.enum(['ves', 'usdt']),
});

export type DirectRequestFormData = z.infer<typeof directRequestSchema>;
