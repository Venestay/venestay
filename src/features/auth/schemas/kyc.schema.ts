import { z } from 'zod';

export const kycSubmissionSchema = z.object({
  documentType: z.string().refine((val) => val === 'cedula' || val === 'pasaporte', {
    message: 'Selecciona el tipo de documento',
  }),
});

export type KYCSubmissionData = z.infer<typeof kycSubmissionSchema>;

// Validación de archivo (helper function)
export function validateKYCFile(file: File): string | null {
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

  if (file.size > MAX_SIZE) {
    return 'El archivo no puede superar 5MB';
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Solo se aceptan imágenes JPG, PNG, WebP o archivos PDF';
  }
  return null;
}
