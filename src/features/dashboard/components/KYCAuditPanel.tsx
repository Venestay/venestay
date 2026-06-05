import React, { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  getKYCSignedUrl, 
  approveKYC, 
  rejectKYC 
} from '@/services/kyc-service';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Eye, 
  Check, 
  X, 
  FileText, 
  ExternalLink,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import Skeleton from '@/components/ui/Skeleton';

interface KYCPendingUser {
  uid: string;
  displayName: string | null;
  photoURL?: string | null;
  email: string | null;
  kycStatus: 'PENDING_REVIEW';
  kycDocumentUrl?: string;
  kycDocumentType?: 'cedula' | 'pasaporte';
  kycSubmittedAt?: Timestamp | string | null;
  trustScore?: number;
  createdAt?: string;
}

const rejectNoteSchema = z.string()
  .min(10, 'El motivo debe tener al menos 10 caracteres')
  .max(500, 'El motivo no puede superar 500 caracteres');

const KYCAuditPanel: React.FC = () => {
  const [users, setUsers] = useState<KYCPendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal de previsualización de documento
  const [previewUser, setPreviewUser] = useState<KYCPendingUser | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);

  // Diálogo de confirmación de aprobación
  const [userToApprove, setUserToApprove] = useState<KYCPendingUser | null>(null);
  const [isApproving, setIsApproving] = useState(false);

  // Modal de confirmación de rechazo
  const [userToReject, setUserToReject] = useState<KYCPendingUser | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [rejectionError, setRejectionError] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);

  // Cargar solicitudes pendientes en tiempo real
  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      where('kycStatus', '==', 'PENDING_REVIEW'),
      orderBy('kycSubmittedAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pendingUsers = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as KYCPendingUser[];
      
      setUsers(pendingUsers);
      setLoading(false);
    }, (error) => {
      console.error('Error listening to KYC pending users:', error);
      toast.error('Error al sincronizar solicitudes de KYC');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Generar URL firmada al seleccionar un usuario para previsualización
  const handleViewDocument = async (user: KYCPendingUser) => {
    setPreviewUser(user);
    setSignedUrl(null);
    setLoadingUrl(true);
    try {
      const url = await getKYCSignedUrl(user.uid);
      setSignedUrl(url);
    } catch (err: unknown) {
      console.error(err);
      toast.error('Error al generar la URL segura del documento');
      setPreviewUser(null);
    } finally {
      setLoadingUrl(false);
    }
  };

  // Confirmar aprobación de KYC
  const handleConfirmApprove = async () => {
    if (!userToApprove) return;
    setIsApproving(true);
    const toastId = toast.loading(`Aprobando verificación para ${userToApprove.displayName || 'Usuario'}...`);
    try {
      await approveKYC(userToApprove.uid);
      toast.success('KYC Aprobado con éxito', {
        description: `${userToApprove.displayName || 'El usuario'} ahora es VERIFIED y su Trust Score ha subido +40.`,
        id: toastId
      });
      setUserToApprove(null);
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : 'Error al aprobar el KYC';
      toast.error(errMsg, { id: toastId });
    } finally {
      setIsApproving(false);
    }
  };

  // Ejecutar rechazo de KYC
  const handleExecuteReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToReject) return;
    
    // Validar motivo con Zod
    const validation = rejectNoteSchema.safeParse(rejectionNote);
    if (!validation.success) {
      setRejectionError(validation.error.issues[0].message);
      return;
    }

    setRejectionError(null);
    setIsRejecting(true);
    const toastId = toast.loading(`Procesando rechazo para ${userToReject.displayName || 'Usuario'}...`);
    try {
      await rejectKYC(userToReject.uid, rejectionNote);
      toast.success('Verificación rechazada', {
        description: 'Se eliminó el documento de Storage y se notificó la razón al usuario.',
        id: toastId
      });
      setUserToReject(null);
      setRejectionNote('');
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : 'Error al rechazar el KYC';
      toast.error(errMsg, { id: toastId });
    } finally {
      setIsRejecting(false);
    }
  };

  // Helper para dar formato amigable a la fecha
  const formatSubmittedDate = (timestamp: Timestamp | string | null | undefined) => {
    if (!timestamp) return '—';
    try {
      const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
      return new Intl.DateTimeFormat('es-VE', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(date);
    } catch {
      return 'Fecha inválida';
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((n) => (
          <div key={n} className="bg-white rounded-[32px] border border-gray-100 p-6 space-y-6 shadow-sm">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-2xl" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-24 w-full rounded-2xl" />
            <div className="flex space-x-3 pt-2">
              <Skeleton className="h-10 flex-1 rounded-xl" />
              <Skeleton className="h-10 flex-1 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-20 w-20 bg-brand-500/10 rounded-full flex items-center justify-center mb-6">
          <ShieldCheck className="h-10 w-10 text-brand-500" />
        </div>
        <h3 className="text-xl font-black text-brand-navy">¡Al día con las verificaciones!</h3>
        <p className="text-sm text-gray-500 mt-2 max-w-sm">
          No hay solicitudes de KYC pendientes de revisión por los administradores.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-brand-navy">
            Solicitudes pendientes ({users.length})
          </h3>
          <p className="text-xs text-gray-500">
            Revisa y valida la documentación de identidad de los huéspedes registrados en la plataforma.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((item) => (
          <div 
            key={item.uid} 
            className="bg-white rounded-[32px] border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              {/* Info principal usuario */}
              <div className="flex items-center space-x-4 mb-4">
                {item.photoURL ? (
                  <img 
                    src={item.photoURL} 
                    alt={item.displayName || 'Usuario'} 
                    className="h-12 w-12 rounded-2xl object-cover ring-2 ring-gray-50"
                  />
                ) : (
                  <div className="h-12 w-12 bg-brand-navy text-white rounded-2xl flex items-center justify-center font-bold">
                    {(item.displayName || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="overflow-hidden">
                  <h4 className="font-bold text-brand-navy truncate">
                    {item.displayName || 'Sin Nombre'}
                  </h4>
                  <p className="text-xs text-gray-400 truncate">
                    {item.email}
                  </p>
                </div>
              </div>

              {/* Detalles de la solicitud */}
              <div className="bg-gray-50/60 rounded-2xl p-4 space-y-2.5 text-xs text-brand-navy mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Tipo de Documento:</span>
                  <span className="font-black uppercase flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-brand-500" />
                    {item.kycDocumentType || 'No indicado'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Enviado el:</span>
                  <span className="font-semibold flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    {formatSubmittedDate(item.kycSubmittedAt)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Trust Score Actual:</span>
                  <span className="font-black px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-navy">
                    {item.trustScore ?? 0} pts
                  </span>
                </div>
              </div>
            </div>

            {/* Acciones principales */}
            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => handleViewDocument(item)}
                className="flex-1 flex items-center justify-center gap-1.5 border border-brand-navy text-brand-navy hover:bg-brand-navy hover:text-white rounded-xl py-2.5 text-[10px] font-black tracking-widest uppercase transition-all"
                aria-label={`Visualizar documento de identidad de ${item.displayName}`}
              >
                <Eye className="h-4 w-4" />
                Ver documento
              </button>
              <button
                onClick={() => setUserToApprove(item)}
                className="flex h-10 w-10 items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all"
                aria-label={`Aprobar verificación KYC para ${item.displayName}`}
                title="Aprobar Verificación"
              >
                <Check className="h-5 w-5" />
              </button>
              <button
                onClick={() => {
                  setUserToReject(item);
                  setRejectionNote('');
                  setRejectionError(null);
                }}
                className="flex h-10 w-10 items-center justify-center bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition-all"
                aria-label={`Rechazar verificación KYC para ${item.displayName}`}
                title="Rechazar Verificación"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Previsualización de Documento */}
      {previewUser && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-[32px] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-brand-navy">
                  Documento de {previewUser.displayName || 'Huésped'}
                </h3>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mt-0.5">
                  {previewUser.kycDocumentType} · Expira en 30 minutos
                </p>
              </div>
              <button 
                onClick={() => {
                  setPreviewUser(null);
                  setSignedUrl(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400 hover:text-brand-navy"
                aria-label="Cerrar vista previa"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-50 p-6 flex items-center justify-center min-h-[300px]">
              {loadingUrl ? (
                <div className="text-center space-y-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto"></div>
                  <p className="text-xs text-gray-500 font-bold">Generando enlace seguro...</p>
                </div>
              ) : signedUrl ? (
                signedUrl.toLowerCase().includes('.pdf') ? (
                  <iframe 
                    src={signedUrl} 
                    className="w-full h-[60vh] rounded-2xl border border-gray-200"
                    title="Visor de Documento PDF"
                  />
                ) : (
                  <img 
                    src={signedUrl} 
                    alt="Documento de Identidad" 
                    className="max-h-[60vh] max-w-full rounded-2xl shadow-sm object-contain"
                  />
                )
              ) : (
                <div className="text-center space-y-2">
                  <AlertCircle className="h-8 w-8 text-rose-500 mx-auto" />
                  <p className="text-xs text-rose-500 font-bold">No se pudo cargar la previsualización.</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end space-x-3 bg-white">
              {signedUrl && (
                <a 
                  href={signedUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 border border-gray-200 hover:bg-gray-50 rounded-xl px-5 py-2.5 text-[10px] font-black tracking-widest uppercase transition-all text-brand-navy"
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir original
                </a>
              )}
              <button
                onClick={() => {
                  setPreviewUser(null);
                  setSignedUrl(null);
                }}
                className="bg-brand-navy text-white rounded-xl px-6 py-2.5 text-[10px] font-black tracking-widest uppercase hover:bg-brand-500 hover:text-brand-navy transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ConfirmDialog: Aprobación */}
      <ConfirmDialog
        isOpen={!!userToApprove}
        onClose={() => setUserToApprove(null)}
        onConfirm={handleConfirmApprove}
        title="¿Aprobar Verificación KYC?"
        message={`Esta acción marcará la identidad de ${userToApprove?.displayName || 'este usuario'} como VERIFICADA. Se le otorgarán +40 puntos de Trust Score para sus reservas y un check verde en el perfil.`}
        confirmText={isApproving ? "Aprobando..." : "Aprobar"}
      />

      {/* Modal: Motivo de Rechazo */}
      {userToReject && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden flex flex-col shadow-2xl p-6">
            <div className="flex items-center space-x-3 text-rose-500 mb-4">
              <ShieldAlert className="h-6 w-6" />
              <h3 className="text-lg font-black text-brand-navy">Rechazar Verificación KYC</h3>
            </div>
            
            <p className="text-xs text-gray-500 mb-4">
              Por favor, indica el motivo del rechazo. El usuario será notificado y su archivo cargado será eliminado de forma permanente de la plataforma.
            </p>

            <form onSubmit={handleExecuteReject} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-brand-navy uppercase tracking-wider mb-2">
                  Motivo de Rechazo (Mínimo 10 caracteres)
                </label>
                <textarea
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  placeholder="Ej: La imagen del documento está borrosa o el pasaporte se encuentra expirado."
                  rows={4}
                  className="w-full text-sm text-brand-navy border border-gray-200 rounded-2xl p-4 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  required
                />
                {rejectionError && (
                  <p className="text-xs text-rose-500 mt-1 font-semibold flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {rejectionError}
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setUserToReject(null);
                    setRejectionNote('');
                    setRejectionError(null);
                  }}
                  className="border border-gray-200 hover:bg-gray-50 rounded-xl px-5 py-2.5 text-[10px] font-black tracking-widest uppercase transition-all text-brand-navy"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isRejecting}
                  className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl px-6 py-2.5 text-[10px] font-black tracking-widest uppercase transition-all disabled:opacity-50"
                >
                  {isRejecting ? "Rechazando..." : "Confirmar Rechazo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KYCAuditPanel;
