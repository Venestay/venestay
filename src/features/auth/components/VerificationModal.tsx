import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, Upload, Loader2, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadAndSubmitKYCDocument } from '@/services/kyc-service';
import { validateKYCFile } from '../schemas/kyc.schema';
import { toast } from 'sonner';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onVerified: (data: Partial<import('../types').UserProfile>) => void;
}

const VerificationModal: React.FC<VerificationModalProps> = ({ isOpen, onClose, userId, onVerified }) => {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<'cedula' | 'pasaporte' | ''>('');
  const [isUploading, setIsUploading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [step, setStep] = useState<'upload' | 'verifying' | 'success'>('upload');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      const error = validateKYCFile(selectedFile);
      if (error) {
        setFileError(error);
        setFile(null);
      } else {
        setFile(selectedFile);
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !documentType) {
      toast.error('Selecciona el tipo de documento y sube un archivo válido');
      return;
    }

    const error = validateKYCFile(file);
    if (error) {
      setFileError(error);
      return;
    }

    setIsUploading(true);
    setStep('verifying');
    
    try {
      await uploadAndSubmitKYCDocument(userId, file, documentType);
      setStep('success');
      toast.success('Documento enviado correctamente');
      setTimeout(() => {
        onVerified({ 
          kycStatus: 'PENDING_REVIEW',
          isIdentityVerified: false // Aún falso hasta revisión de admin
        });
        onClose();
        // Reset states
        setFile(null);
        setDocumentType('');
        setStep('upload');
      }, 2500);
    } catch (error: unknown) {
      console.error('Error uploading document:', error);
      toast.error(error instanceof Error ? error.message : 'No se pudo subir el documento');
      setStep('upload');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-navy/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-gray-100 bg-white p-8 text-brand-navy shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute right-6 top-6 text-gray-300 hover:text-brand-navy transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            {step === 'upload' && (
              <div className="space-y-6 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-50 text-brand-500">
                  <ShieldCheck className="h-10 w-10" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-black tracking-tight">Verifica tu Identidad</h3>
                  <p className="text-sm text-gray-500">Sube una foto legible de tu Cédula o Pasaporte vigente para habilitar todas las funciones.</p>
                </div>

                <div className="space-y-4">
                  {/* Selector de Tipo de Documento */}
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tipo de Documento</label>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setDocumentType('cedula')}
                        className={cn(
                          "flex-1 py-3 px-4 rounded-xl border text-xs font-bold transition-all duration-200",
                          documentType === 'cedula'
                            ? "border-brand-500 bg-brand-50 text-brand-navy shadow-sm"
                            : "border-gray-100 bg-white hover:bg-gray-50 text-gray-500"
                        )}
                      >
                        Cédula
                      </button>
                      <button
                        type="button"
                        onClick={() => setDocumentType('pasaporte')}
                        className={cn(
                          "flex-1 py-3 px-4 rounded-xl border text-xs font-bold transition-all duration-200",
                          documentType === 'pasaporte'
                            ? "border-brand-500 bg-brand-50 text-brand-navy shadow-sm"
                            : "border-gray-100 bg-white hover:bg-gray-50 text-gray-500"
                        )}
                      >
                        Pasaporte
                      </button>
                    </div>
                  </div>

                  <div 
                    className={cn(
                      "relative cursor-pointer rounded-2xl border-2 border-dashed border-gray-100 p-8 transition-all hover:bg-gray-50",
                      file && "border-brand-500/30 bg-brand-50"
                    )}
                  >
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept="image/*,.pdf"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="space-y-2">
                      {file ? (
                        <>
                          <FileText className="mx-auto h-8 w-8 text-brand-500" />
                          <p className="text-xs font-bold text-brand-navy">{file.name}</p>
                        </>
                      ) : (
                        <>
                          <Upload className="mx-auto h-8 w-8 text-gray-300" />
                          <p className="text-xs font-medium text-gray-400">Seleccionar documento</p>
                        </>
                      )}
                    </div>
                  </div>

                  {fileError && (
                    <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-left text-xs font-medium text-red-600">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{fileError}</span>
                    </div>
                  )}

                  <button
                    disabled={!file || !documentType || isUploading}
                    onClick={handleUpload}
                    className="w-full rounded-2xl bg-brand-500 py-4 text-xs font-black tracking-widest text-white uppercase shadow-lg shadow-brand-500/20 transition-all hover:brightness-110 active:scale-95 disabled:opacity-30 disabled:shadow-none"
                  >
                    Enviar para Validación
                  </button>
                </div>
              </div>
            )}

            {step === 'verifying' && (
              <div className="space-y-8 py-10 text-center">
                <div className="relative mx-auto h-24 w-24">
                  <div className="absolute inset-0 animate-ping rounded-full bg-brand-500/10" />
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-brand-50 text-brand-500">
                    <Loader2 className="h-12 w-12 animate-spin" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black tracking-tight">Procesando Identidad</h3>
                  <p className="text-sm text-gray-500">Nuestro sistema está analizando los metadatos y la legibilidad del documento...</p>
                </div>
              </div>
            )}

            {step === 'success' && (
              <div className="space-y-8 py-10 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500 text-white"
                >
                  <CheckCircle2 className="h-12 w-12" />
                </motion.div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black tracking-tight text-emerald-600">¡Documento Recibido!</h3>
                  <p className="text-sm text-gray-500">Tu identidad está en revisión. El estatus de tu pasaporte se actualizará en unos minutos.</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default VerificationModal;
