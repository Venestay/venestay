import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/features/auth/hooks/AuthContext';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';

interface ChatNotificationContextType {
  unreadCount: number;
  unreadPerBooking: Record<string, number>;
}

const ChatNotificationContext = createContext<ChatNotificationContextType>({ unreadCount: 0, unreadPerBooking: {} });

export const ChatNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profileData, isAdmin } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadPerBooking, setUnreadPerBooking] = useState<Record<string, number>>({});
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const q = query(
      collection(db, 'messages'),
      where('recipientId', '==', user.uid),
      where('status', '==', 'sent')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setUnreadCount(snapshot.docs.length);
        
        const counts: Record<string, number> = {};
        snapshot.docs.forEach(doc => {
          const bookingId = doc.data().bookingId;
          if (bookingId) {
            counts[bookingId] = (counts[bookingId] || 0) + 1;
          }
        });
        setUnreadPerBooking(counts);

        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const msg = change.doc.data();
            const currentPath = window.location.pathname;
            
            // Supresión contextual: no notificar si ya estamos en el chat de esa reserva
            const isGuestOnCheckout = currentPath.includes(`/checkout/${msg.bookingId}`);
            const isHostOnDashboard = currentPath.includes('/dashboard') || currentPath.includes('/admin/mis-propiedades');
            // Nota: En AdminDashboard podríamos tener otro chat abierto, pero para simplificar
            // omitimos el toast si está en el dashboard y el mensaje es para el host, 
            // ya que el host lo verá en la lista. Si queremos ser más estrictos, 
            // requeriríamos saber el `activeChatId` global.
            
            const isHost = isAdmin || profileData?.role === 'host';
            const shouldSuppress = isGuestOnCheckout || (isHost && isHostOnDashboard);

            if (!shouldSuppress) {
              toast.info(`Nuevo mensaje de ${msg.senderName}`, {
                description: msg.type === 'image' ? '📎 Comprobante de pago' : msg.text,
                id: `chat-${msg.bookingId}`, // Agrupa por reserva
                duration: 5000,
                action: {
                  label: 'Responder',
                  onClick: () => {
                    if (isHost) {
                      navigate('/admin/mis-propiedades'); // o donde sea más útil para el host
                    } else {
                      navigate(`/checkout/${msg.bookingId}`);
                    }
                  }
                }
              });
            }
          }
        });
      },
      (error) => {
        console.error('Error listening to chat notifications:', error);
      }
    );

    return () => unsubscribe();
  }, [user, navigate, isAdmin, profileData]); // location dependency removed to avoid re-running snapshot on every route change

  return (
    <ChatNotificationContext.Provider value={{ unreadCount, unreadPerBooking }}>
      {children}
    </ChatNotificationContext.Provider>
  );
};

export const useChatNotifications = () => useContext(ChatNotificationContext);
