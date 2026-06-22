// eslint-disable-next-line @typescript-eslint/no-require-imports
import PDFDocument = require('pdfkit');

export const buildBookingConfirmationPDF = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  booking: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  guest: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listing: any
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      // Configurar el documento (A4, márgenes)
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Resumen de Reserva - ${booking.id}`,
          Author: 'VeneStay',
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Colores de la marca
      const colors = {
        navy: '#0B1120',
        gold: '#C5A059',
        gray: '#4B5563',
        lightGray: '#F3F4F6',
        text: '#1F2937',
        white: '#FFFFFF',
      };

      // Helper para formatear fechas
      const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-VE', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
      };

      const startDateStr = formatDate(booking.startDate);
      const endDateStr = formatDate(booking.endDate);
      
      const startDate = booking.startDate ? new Date(booking.startDate) : new Date();
      const endDate = booking.endDate ? new Date(booking.endDate) : new Date();
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const totalNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

      // ==========================================
      // HEADER
      // ==========================================
      doc.rect(0, 0, doc.page.width, 100).fill(colors.navy);
      
      doc.fillColor(colors.gold)
         .fontSize(24)
         .font('Helvetica-Bold')
         .text('VENESTAY', 50, 40);
         
      doc.fillColor('#9CA3AF')
         .fontSize(10)
         .font('Helvetica')
         .text('ALQUILERES PREMIUM · LECHERÍA', 50, 65);

      // Etiqueta "Reserva Confirmada" a la derecha
      doc.rect(doc.page.width - 220, 40, 170, 25)
         .fillOpacity(0.2)
         .fill(colors.gold);
      
      doc.fillOpacity(1);
      doc.rect(doc.page.width - 220, 40, 170, 25).stroke(colors.gold);
         
      doc.fillColor(colors.white)
         .fontSize(11)
         .font('Helvetica-Bold')
         .text('RESERVA CONFIRMADA', doc.page.width - 215, 48, { width: 160, align: 'center' });

      // ==========================================
      // INFORMACIÓN DE LA PROPIEDAD
      // ==========================================
      let currentY = 130;
      
      doc.fillColor(colors.navy)
         .fontSize(18)
         .font('Helvetica-Bold')
         .text(listing.title || 'Propiedad VeneStay', 50, currentY);
         
      currentY += 25;
      
      doc.fillColor(colors.gray)
         .fontSize(11)
         .font('Helvetica')
         .text(`Dirección: ${listing.manualAddress || listing.location || 'Lechería, Anzoátegui'}`, 50, currentY);
         
      currentY += 15;
      
      doc.fillColor(colors.gray)
         .fontSize(11)
         .text(`Huésped: ${guest.displayName || guest.email || 'Huésped'}`, 50, currentY);
         
      currentY += 15;
      
      doc.fillColor(colors.gray)
         .text(`Personas: ${booking.guests} huésped(es)`, 50, currentY);

      currentY += 40;

      // ==========================================
      // DETALLES DE LA ESTADÍA (Caja Grid)
      // ==========================================
      doc.rect(50, currentY, doc.page.width - 100, 80)
         .fillAndStroke(colors.lightGray, '#E5E7EB');
         
      doc.fillColor(colors.gray)
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('ESTADÍA', 70, currentY + 15);
         
      doc.fillColor(colors.navy)
         .fontSize(14)
         .text(`${totalNights} Noche(s)`, 70, currentY + 30);
         
      doc.fillColor(colors.gray)
         .fontSize(10)
         .font('Helvetica')
         .text(`${startDateStr} -> ${endDateStr}`, 70, currentY + 50);

      // Separador vertical
      doc.moveTo(doc.page.width / 2, currentY + 10)
         .lineTo(doc.page.width / 2, currentY + 70)
         .stroke('#D1D5DB');

      doc.fillColor(colors.gray)
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('HORARIOS', doc.page.width / 2 + 20, currentY + 15);
         
      doc.fillColor(colors.navy)
         .fontSize(12)
         .text(`Check-In:  ${listing.checkInTime || '14:00'}`, doc.page.width / 2 + 20, currentY + 32);
         
      doc.text(`Check-Out: ${listing.checkOutTime || '11:00'}`, doc.page.width / 2 + 20, currentY + 50);

      currentY += 110;

      // ==========================================
      // ESTADO DEL PAGO
      // ==========================================
      doc.rect(50, currentY, doc.page.width - 100, 60)
         .fillAndStroke('#ECFDF5', '#A7F3D0'); // Verde claro
         
      doc.fillColor('#065F46') // Verde oscuro
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('¡Tu estadía está confirmada!', 70, currentY + 15);
         
      doc.fillColor('#047857')
         .fontSize(10)
         .font('Helvetica')
         .text('El anfitrión ha verificado la garantía del 20% y asegurado tus fechas.', 70, currentY + 35);
         
      currentY += 90;

      // ==========================================
      // RESUMEN DE SALDO
      // ==========================================
      doc.fillColor(colors.gold)
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('RESUMEN DE SALDO', 50, currentY);
         
      currentY += 20;
      
      const summaryHeight = 100;
      doc.rect(50, currentY, doc.page.width - 100, summaryHeight)
         .fillAndStroke(colors.lightGray, '#E5E7EB');

      let summaryY = currentY + 15;
      const totalAmount = booking.totalAmount || 0;
      const paidAmount = totalAmount * 0.2;
      const pendingAmount = totalAmount * 0.8;

      // Fila 1: Total
      doc.fillColor(colors.text).font('Helvetica-Bold').fontSize(11);
      doc.text('Total de la Estadía', 70, summaryY);
      doc.text(`$${totalAmount.toFixed(2)}`, doc.page.width - 120, summaryY, { width: 50, align: 'right' });
      
      doc.moveTo(70, summaryY + 15).lineTo(doc.page.width - 70, summaryY + 15).stroke('#D1D5DB');
      summaryY += 25;

      // Fila 2: Pagado
      doc.fillColor(colors.gold);
      doc.text('Garantía Pagada (20%)', 70, summaryY);
      doc.text(`$${paidAmount.toFixed(2)}`, doc.page.width - 120, summaryY, { width: 50, align: 'right' });
      
      doc.moveTo(70, summaryY + 15).lineTo(doc.page.width - 70, summaryY + 15).stroke('#D1D5DB');
      summaryY += 25;

      // Fila 3: Pendiente
      doc.fillColor(colors.text);
      doc.text('Saldo Pendiente (80%)', 70, summaryY);
      doc.fillColor(colors.gray).fontSize(9).font('Helvetica');
      doc.text('A pagar al anfitrión el día del Check-in', 70, summaryY + 13);
      
      doc.fillColor(colors.navy).font('Helvetica-Bold').fontSize(12);
      doc.text(`$${pendingAmount.toFixed(2)}`, doc.page.width - 120, summaryY + 5, { width: 50, align: 'right' });

      currentY += summaryHeight + 30;

      // ==========================================
      // REFERENCIA DE TRANSACCIÓN
      // ==========================================
      doc.fillColor(colors.gold)
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('COMPROBANTE DE PAGO', 50, currentY);
         
      currentY += 20;
      
      doc.rect(50, currentY, doc.page.width - 100, 60)
         .fillAndStroke(colors.lightGray, '#E5E7EB');
         
      doc.fillColor(colors.gray)
         .fontSize(9)
         .font('Helvetica-Bold')
         .text('REFERENCIA DE TRANSACCIÓN', 70, currentY + 15);
         
      doc.fillColor(colors.navy)
         .fontSize(14)
         .font('Courier-Bold')
         .text(booking.paymentReference || 'NO ESPECIFICADA', 70, currentY + 30);
         
      doc.fillColor('#10B981')
         .fontSize(9)
         .font('Helvetica-Bold')
         .text('✓ Garantía del 20% recibida y verificada', doc.page.width / 2, currentY + 32);

      // ==========================================
      // NORMAS DE LA CASA Y POLÍTICAS
      // ==========================================
      currentY += 90;
      
      // Control de paginación para evitar sobreposición con el footer
      if (currentY > doc.page.height - 180) {
        doc.addPage();
        currentY = 50; 
      }

      doc.fillColor(colors.gold)
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('NORMAS DE LA CASA Y POLÍTICAS', 50, currentY);
         
      currentY += 20;

      // Línea superior de la caja de normas
      doc.moveTo(50, currentY).lineTo(doc.page.width - 50, currentY).stroke('#E5E7EB');
      
      let rulesY = currentY + 15;
      
      // Fila 1 de reglas (Mascotas y Fumar)
      doc.fillColor(colors.gray).fontSize(10).font('Helvetica-Bold').text('• Mascotas:', 55, rulesY);
      doc.fillColor(listing.isPetFriendly ? '#10B981' : '#EF4444').font('Helvetica').text(listing.isPetFriendly ? 'Permitidas' : 'No permitidas', 120, rulesY);

      doc.fillColor(colors.gray).font('Helvetica-Bold').text('• Fumar:', doc.page.width / 2, rulesY);
      doc.fillColor(listing.allowSmoking ? '#10B981' : '#EF4444').font('Helvetica').text(listing.allowSmoking ? 'Permitido' : 'No permitido', doc.page.width / 2 + 50, rulesY);

      rulesY += 20;

      // Fila 2 de reglas (Eventos y Cancelación)
      doc.fillColor(colors.gray).font('Helvetica-Bold').text('• Fiestas/Eventos:', 55, rulesY);
      doc.fillColor(listing.allowEvents ? '#10B981' : '#EF4444').font('Helvetica').text(listing.allowEvents ? 'Permitidos' : 'No permitidos', 155, rulesY);

      doc.fillColor(colors.gray).font('Helvetica-Bold').text('• Cancelación:', doc.page.width / 2, rulesY);
      doc.fillColor(colors.navy).font('Helvetica').text(listing.cancellationPolicy || 'Estricta', doc.page.width / 2 + 80, rulesY);

      rulesY += 30;

      // Normas Adicionales
      if (listing.additionalRules && listing.additionalRules.length > 0) {
        doc.fillColor(colors.gray).font('Helvetica-Bold').fontSize(9).text('NORMAS ADICIONALES DEL ANFITRIÓN:', 55, rulesY);
        rulesY += 15;
        doc.fillColor(colors.gray).font('Helvetica').fontSize(9);
        
        listing.additionalRules.forEach((rule: string) => {
           doc.text(`- ${rule}`, 55, rulesY, { width: doc.page.width - 110 });
           rulesY += doc.heightOfString(`- ${rule}`, { width: doc.page.width - 110 }) + 5;
        });
      }

      // Línea inferior de la caja de normas
      doc.moveTo(50, rulesY + 5).lineTo(doc.page.width - 50, rulesY + 5).stroke('#E5E7EB');

      // ==========================================
      // FOOTER
      // ==========================================
      const bottomY = doc.page.height - 70;
      
      doc.moveTo(50, bottomY - 10).lineTo(doc.page.width - 50, bottomY - 10).stroke('#E5E7EB');
      
      doc.fillColor(colors.gray)
         .fontSize(9)
         .font('Helvetica')
         .text(`Código de Reserva: ${(booking.id || '').slice(0, 8).toUpperCase()}`, 50, bottomY);
         
      doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-VE')}`, doc.page.width - 200, bottomY, { width: 150, align: 'right' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
