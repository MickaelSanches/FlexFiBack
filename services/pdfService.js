const PDFDocument = require('pdfkit');
const fs = require('fs');

class PDFService {
    // Générer un PDF stylisé avec police "Days" et couleur #00fefb
    generateSchedulePDF(sale, schedule, type) {
        const doc = new PDFDocument({ margin: 50 });
        const fileName = type === 'shopper' ? `schedule_shopper_${sale.id}.pdf` : `schedule_merchant_${sale.id}.pdf`;

        doc.pipe(fs.createWriteStream(fileName));

        // Ajouter une bannière noire pour le logo FlexFi
        doc.rect(0, 0, doc.page.width, 100).fill('#000000');

        // Ajouter le logo de FlexFi (modifie le chemin selon l'emplacement de ton fichier)
        doc.image('./1.png', 50, 20, { width: 80 }); // Ajustez la taille et la position selon vos préférences

        doc.registerFont('Days', './Days.ttf');

        // Ajouter le titre en blanc sur la bannière
        doc.fillColor('#FFFFFF')
            .font('Days')
            .fontSize(28)
            .text('Schedule', 150, 40, { align: 'center' });

        // Ajouter une ligne de séparation colorée
        doc.moveDown(2).lineWidth(1.5).strokeColor('#00fefb').moveTo(50, 120).lineTo(550, 120).stroke();

        // Détails de la vente
        doc.fillColor('#000000').fontSize(16);
        doc.moveDown(1.5).text(`Vente ID: ${sale.id}`, { align: 'center' });
        doc.text(`Seller: ${sale.seller_pubkey}`, { align: 'center' });
        doc.text(`Buyer: ${sale.buyer_pubkey}`, { align: 'center' });
        doc.text(`Total amount: ${sale.amount} ${sale.currency}`, { align: 'center' });
        doc.text(`Duration: ${sale.months} month`, { align: 'center' });

        // Ajouter une autre ligne de séparation
        doc.lineWidth(1.5).strokeColor('#00fefb').moveTo(50, doc.y + 10).lineTo(550, doc.y + 10).stroke();

        // Espacement et section des échéances
        doc.moveDown(2).fillColor('#00fefb').fontSize(18).text('Deadline details :', { underline: true, align: 'left' });

        // Tableau des échéances
        doc.moveDown(1);
        schedule.forEach((payment, index) => {
            doc.fillColor('#555555').fontSize(14).text(
                `Month ${index + 1} : ${payment.payment_amount} ${sale.currency} - Due date: ${new Date(payment.due_date).toLocaleDateString()}`,
                { indent: 40 }
            );
        });

        // Note de bas de page ou informations supplémentaires
        doc.moveDown(2).fillColor('#00fefb').fontSize(12).text('Thank you for trusting FlexFi!', { align: 'center' });

        // Finaliser le document
        doc.end();

        return fileName;
    }
}

module.exports = new PDFService();
