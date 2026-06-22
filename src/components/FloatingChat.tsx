import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageSquare, ShieldCheck, ExternalLink } from 'lucide-react';
import Chat from '@/components/Chat';
import { cn } from '@/lib/utils';

interface FloatingChatProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string | null;
  listingTitle: string;
  senderId: string;
  senderName: string;
  recipientName: string;
  recipientId?: string;
  isHost?: boolean;
}

const FloatingChat: React.FC<FloatingChatProps> = ({
  isOpen,
  onClose,
  bookingId,
  listingTitle,
  senderId,
  senderName,
  recipientName,
  recipientId,
  isHost,
}) => {
  return (
    <AnimatePresence>
      {isOpen && bookingId && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-0 right-0 z-200 flex h-full w-full flex-col border-l border-gray-100 bg-white shadow-[-20px_0_50px_rgba(0,0,0,0.1)] sm:w-[450px]"
        >
          {/* Header Binance Style */}
          <div className="bg-brand-navy shrink-0 p-6 text-white">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-brand-500 text-brand-navy flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-black">
                  {recipientName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg leading-none font-black">
                    {recipientName}
                  </h3>
                  <div className="mt-1 flex items-center gap-1.5 text-emerald-400">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                    <span className="text-[10px] font-black tracking-widest uppercase">
                      En Línea
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-xl bg-white/10 p-2.5 transition-all hover:rotate-90 hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-brand-500 text-[8px] font-black tracking-widest uppercase">
                  Transacción Segura
                </span>
                <span className="text-[8px] font-black tracking-widest text-white/40 uppercase">
                  REF: {bookingId.slice(0, 8)}
                </span>
              </div>
              <h4 className="line-clamp-1 text-xs font-bold text-white/90">
                {listingTitle}
              </h4>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="flex items-start gap-3 border-b border-amber-100 bg-amber-50 p-3 px-6">
            <ShieldCheck className="mt-0.5 h-4 w-4 text-amber-500" />
            <p className="text-[10px] leading-tight font-bold text-amber-700">
              Mantén tus comunicaciones y pagos dentro de VeneStay para
              garantizar tu protección. Nunca compartas datos de contacto
              personales.
            </p>
          </div>

          {/* Chat Component */}
          <div className="flex grow flex-col overflow-hidden">
            <Chat
              bookingId={bookingId}
              senderId={senderId}
              senderName={senderName}
              recipientId={recipientId}
              isFloating={true}
              isHost={isHost}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingChat;






