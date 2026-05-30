import React, { useState, useEffect, useRef } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
  writeBatch,
} from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { Message } from '@/types';
import {
  Send,
  User,
  ShieldCheck,
  Loader2,
  MessageSquare,
  Image as ImageIcon,
  Check,
  CheckCheck,
  Paperclip,
} from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ImageModal } from '@/components/ui/ImageModal';

interface ChatProps {
  bookingId: string;
  senderId: string;
  senderName: string;
  recipientId?: string;
  isFloating?: boolean;
  onAuthRequired?: () => void;
}

const Chat: React.FC<ChatProps> = ({
  bookingId,
  senderId,
  senderName,
  recipientId,
  isFloating,
  onAuthRequired,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!bookingId) return;

    setLoading(true);
    const q = query(
      collection(db, 'messages'),
      where('bookingId', '==', bookingId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data({ serverTimestamps: 'estimate' }),
        })) as Message[];

        // Sort client-side to avoid index requirement
        const sortedMsgs = msgs.sort((a, b) => {
          const getTime = (ca: string | Date | { seconds?: number } | number | undefined | null) => {
            if (!ca) return 0;
            if ((ca as { seconds?: number }).seconds) return (ca as { seconds?: number }).seconds! * 1000;
            if (ca instanceof Date) return ca.getTime();
            if (typeof ca === 'string') return new Date(ca).getTime();
            if (typeof ca === 'number') return ca;
            return 0;
          };
          return getTime(a.createdAt) - getTime(b.createdAt);
        });

        setMessages([...sortedMsgs]);
        setLoading(false);

        // Mark unread messages from OTHERS as read
        const unreadFromOthers = snapshot.docs.filter((doc) => {
          const data = doc.data();
          return data.senderId !== senderId && data.status === 'sent';
        });

        if (unreadFromOthers.length > 0) {
          const batch = writeBatch(db);
          unreadFromOthers.forEach((d) => {
            batch.update(doc(db, 'messages', d.id), { status: 'read' });
          });
          batch
            .commit()
            .catch((err) => console.error('Error marking as read:', err));
        }
      },
      (error) => {
        console.error('Chat error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [bookingId, senderId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (
    e?: React.FormEvent,
    type: 'text' | 'image' = 'text',
    data?: string
  ) => {
    if (e) e.preventDefault();
    if (type === 'text' && !newMessage.trim()) return;

    try {
      const payload: Record<string, unknown> = {
        bookingId,
        senderId,
        senderName,
        type,
        status: 'sent',
        createdAt: serverTimestamp(),
      };
      
      if (recipientId) {
        payload.recipientId = recipientId;
      }

      if (type === 'text') {
        payload.text = newMessage.trim();
        setNewMessage('');
      } else {
        payload.imageUrl = data;
      }

      await addDoc(collection(db, 'messages'), payload);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Compress image
      let uploadFile: File | Blob = file;
      if (file.type.startsWith('image/')) {
        const imageCompression = (await import('browser-image-compression'))
          .default;
        const options = {
          maxSizeMB: 0.5, // 500KB max for receipts
          maxWidthOrHeight: 1200,
          useWebWorker: true,
        };
        uploadFile = await imageCompression(file, options);
      }

      const storageRef = ref(
        storage,
        `receipts/${bookingId}/${Date.now()}_${file.name}`
      );
      const metadata = {
        contentType: file.type,
        cacheControl: 'public,max-age=31536000',
      };
      let url = `https://placehold.co/400x600/2a3b5c/ffffff?text=Envio+(Storage+Bloqueado)`;
      try {
        await uploadBytes(storageRef, uploadFile, metadata);
        url = await getDownloadURL(storageRef);
      } catch (err: unknown) {
        const storageError = err as { code?: string; message?: string };
        if (
          storageError?.code === 'storage/unauthorized' ||
          storageError?.message?.includes('storage/unauthorized') ||
          storageError?.message?.includes('does not have permission')
        ) {
          console.warn('Storage upload unauthorized. Using fallback URL.');
        } else {
          throw err;
        }
      }
      await handleSendMessage(undefined, 'image', url);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Error al subir el comprobante.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div
      className={cn(
        'flex h-full flex-col overflow-hidden bg-gray-50',
        !isFloating && 'rounded-2xl border border-gray-100'
      )}
    >
      {!isFloating && (
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-white p-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="text-brand-500 h-4 w-4" />
            <span className="text-brand-navy text-[10px] font-black tracking-widest uppercase">
              Mensajería Segura
            </span>
          </div>
        </div>
      )}

      <div
        ref={scrollRef}
        className="no-scrollbar flex-grow space-y-6 overflow-y-auto p-6 pb-10"
      >
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="text-brand-500 h-8 w-8 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center space-y-4 p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-gray-100 bg-white shadow-sm">
              <MessageSquare className="h-8 w-8 text-gray-200" />
            </div>
            <p className="text-[10px] leading-relaxed font-black tracking-widest text-gray-400 uppercase">
              No hay mensajes aún.
              <br />
              Describe tu duda al anfitrión.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderId === senderId;
            const showName =
              idx === 0 || messages[idx - 1].senderId !== msg.senderId;

            return (
              <div
                key={msg.id}
                className={cn(
                  'flex max-w-[85%] flex-col space-y-1',
                  isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                )}
              >
                {showName && (
                  <span
                    className={cn(
                      'mb-1 text-[8px] font-black tracking-widest uppercase',
                      isMe ? 'text-brand-navy/40' : 'text-brand-500'
                    )}
                  >
                    {msg.senderName}
                  </span>
                )}
                <div
                  className={cn(
                    'group relative rounded-2xl px-4 py-3 text-[13px] font-medium shadow-sm transition-all',
                    isMe
                      ? 'bg-brand-navy hover:bg-brand-navy/90 rounded-tr-none text-white'
                      : 'text-brand-navy rounded-tl-none border border-gray-100 bg-white hover:shadow-md'
                  )}
                >
                  {msg.type === 'image' ? (
                    <div className="space-y-2">
                      <img
                        src={(msg as { imageUrl?: string }).imageUrl}
                        alt="Comprobante"
                        className="max-w-full cursor-pointer rounded-lg transition-opacity hover:opacity-90"
                        onClick={() => {
                          const url = (msg as { imageUrl?: string }).imageUrl;
                          if (url) setViewingImage(url);
                        }}
                      />
                      <p className="text-[10px] font-black tracking-widest uppercase opacity-60">
                        Comprobante de Pago
                      </p>
                    </div>
                  ) : (
                    (msg as { text?: string }).text
                  )}
                </div>
                <div className="mt-1 flex items-center space-x-1.5">
                  <span className="text-[8px] font-bold text-gray-400 uppercase">
                    {(() => {
                      const ca = msg.createdAt;
                      if (!ca) return '...';
                      let date: Date;
                      if ((ca as { seconds?: number }).seconds) date = new Date((ca as { seconds?: number }).seconds! * 1000);
                      else if (ca instanceof Date) date = ca;
                      else if (typeof ca === 'string') date = new Date(ca);
                      else if (typeof ca === 'number') date = new Date(ca);
                      else return '...';

                      return isNaN(date.getTime())
                        ? '...'
                        : format(date, 'HH:mm');
                    })()}
                  </span>
                  {isMe && (
                    <div className="flex items-center">
                      {msg.status === 'read' ? (
                        <CheckCheck className="text-brand-500 h-3 w-3" />
                      ) : (
                        <Check className="h-3 w-3 text-gray-300" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <form
        onSubmit={(e) => {
          if (senderId === 'guest') {
            e.preventDefault();
            onAuthRequired?.();
            return;
          }
          handleSendMessage(e);
        }}
        className="shrink-0 border-t border-gray-100 bg-white p-6"
      >
        <div className="focus-within:border-brand-500 focus-within:ring-brand-500/5 flex items-center gap-3 rounded-[24px] border border-gray-100 bg-gray-50 p-2 transition-all focus-within:ring-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*"
          />
          <button
            type="button"
            onClick={(e) => {
              if (senderId === 'guest') {
                e.preventDefault();
                onAuthRequired?.();
                return;
              }
              fileInputRef.current?.click();
            }}
            disabled={uploading}
            className="hover:text-brand-500 p-2 text-gray-400 transition-colors"
            title="Adjuntar comprobante"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Paperclip className="h-5 w-5" />
            )}
          </button>
          <input
            type="text"
            value={newMessage}
            onFocus={(e) => {
              if (senderId === 'guest') {
                e.target.blur();
                onAuthRequired?.();
              }
            }}
            onClick={(e) => {
              if (senderId === 'guest') {
                (e.target as HTMLInputElement).blur();
                onAuthRequired?.();
              }
            }}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={
              senderId === 'guest'
                ? 'Inicia sesión para escribir al anfitrión...'
                : 'Escribe un mensaje seguro...'
            }
            className="flex-grow rounded-xl border-none bg-transparent px-2 py-2 text-sm font-medium placeholder:text-gray-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={(senderId !== 'guest' && !newMessage.trim()) || uploading}
            onClick={(e) => {
              if (senderId === 'guest') {
                e.preventDefault();
                onAuthRequired?.();
              }
            }}
            className="bg-brand-navy hover:bg-brand-500 hover:text-brand-navy group shrink-0 rounded-[20px] p-3 text-white shadow-xl transition-all active:scale-90 disabled:opacity-30 disabled:grayscale"
          >
            <Send className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>
      </form>

      <ImageModal
        isOpen={!!viewingImage}
        onClose={() => setViewingImage(null)}
        imageUrl={viewingImage || ''}
        altText="Comprobante de Pago"
      />
    </div>
  );
};

export default Chat;






