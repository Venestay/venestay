import { useEffect } from 'react';

// Si utilizas Firebase Analytics, lo importarías aquí:
// import { getAnalytics, logEvent } from 'firebase/analytics';
// import { app } from '@/config/firebase'; // o de donde se exporte

export const useAnalytics = () => {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const elementWithAnalytics = target.closest('[data-analytics]') as HTMLElement;
      
      if (elementWithAnalytics) {
        const eventName = elementWithAnalytics.getAttribute('data-analytics');
        const ctaType = eventName === 'footer_whatsapp_support' ? 'support' : 'host_register';
        const location = elementWithAnalytics.closest('.fixed') ? 'info_modal' : 'footer';
        
        console.log(`[Analytics Event] whatsapp_click | cta: ${ctaType} | location: ${location}`);
        
        // TODO: Integración real con Firebase Analytics
        // const analytics = getAnalytics(app);
        // logEvent(analytics, 'whatsapp_cta_click', { cta_type: ctaType, location });
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);
};
