import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import { articleRepository, mouvementRepository } from '@/database';
import { predictiveService } from './predictiveService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const pdfReportService = {
  async generateMonthlyReport(siteId: string | number, siteName: string) {
    try {
      // 1. Récupérer les données
      const [articles, lowStockCount, mouvementsMois, alertesPredictives] = await Promise.all([
        articleRepository.findAll(siteId),
        articleRepository.countLowStock(siteId),
        mouvementRepository.findRecent(siteId, 100), // On prend les 100 derniers pour simplifier
        predictiveService.getPredictiveAlerts(siteId, 30, 14),
      ]);

      const currentDate = format(new Date(), 'dd MMMM yyyy', { locale: fr });
      
      // 2. Construire le HTML avec le style Crédit Agricole
      const htmlContent = `
        <html>
          <head>
            <style>
              body {
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                color: #1A1A1A;
                padding: 40px;
              }
              .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 2px solid #007D70;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              .title {
                color: #007D70;
                font-size: 24px;
                font-weight: bold;
              }
              .subtitle {
                color: #666;
                font-size: 14px;
              }
              .card-container {
                display: flex;
                gap: 20px;
                margin-bottom: 30px;
              }
              .card {
                flex: 1;
                background-color: #F5F5F0;
                border-radius: 8px;
                padding: 15px;
                text-align: center;
              }
              .card h3 {
                margin: 0;
                color: #007D70;
                font-size: 28px;
              }
              .card p {
                margin: 5px 0 0;
                color: #666;
                font-size: 12px;
                text-transform: uppercase;
              }
              h2 {
                color: #0F1B14;
                border-bottom: 1px solid #E0E0E0;
                padding-bottom: 10px;
                margin-top: 40px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 15px;
              }
              th, td {
                text-align: left;
                padding: 12px;
                border-bottom: 1px solid #E0E0E0;
              }
              th {
                background-color: #007D70;
                color: white;
              }
              .warning {
                color: #D97706;
                font-weight: bold;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <div class="title">Bilan Mensuel des Stocks</div>
                <div class="subtitle">Site : ${siteName}</div>
              </div>
              <div>
                <div class="subtitle">Édité le ${currentDate}</div>
              </div>
            </div>

            <div class="card-container">
              <div class="card">
                <h3>${articles.total}</h3>
                <p>Articles en stock</p>
              </div>
              <div class="card" style="${lowStockCount > 0 ? 'background-color: #FEF2F2; color: #DC2626;' : ''}">
                <h3 style="${lowStockCount > 0 ? 'color: #DC2626;' : ''}">${lowStockCount}</h3>
                <p>Alertes stock mini</p>
              </div>
            </div>

            <h2>🔮 Alertes Prédictives (Risque de rupture)</h2>
            ${alertesPredictives.length > 0 ? `
            <table>
              <tr>
                <th>Article</th>
                <th>Stock Actuel</th>
                <th>Consommation / jr</th>
                <th>Rupture estimée dans</th>
              </tr>
              ${alertesPredictives.map(a => `
                <tr>
                  <td>${a.articleNom}</td>
                  <td>${a.currentStock}</td>
                  <td>${a.velocity.toFixed(1)}</td>
                  <td class="warning">${a.daysRemaining} jours</td>
                </tr>
              `).join('')}
            </table>
            ` : '<p>Aucun article en risque de rupture imminente.</p>'}

            <h2>Derniers Mouvements</h2>
            <table>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Article</th>
                <th>Quantité</th>
              </tr>
              ${mouvementsMois.slice(0, 15).map(m => `
                <tr>
                  <td>${format(new Date(m.dateMouvement), 'dd/MM/yyyy HH:mm')}</td>
                  <td>${m.type}</td>
                  <td>${m.article?.nom || 'Inconnu'}</td>
                  <td>${m.quantite}</td>
                </tr>
              `).join('')}
            </table>
          </body>
        </html>
      `;

      // 3. Générer le PDF
      const options = {
        html: htmlContent,
        fileName: \`bilan_stock_\${format(new Date(), 'yyyy_MM_dd')}\`,
        directory: 'Documents',
      };

      const file = await RNHTMLtoPDF.convert(options);

      // 4. Partager / Enregistrer
      if (file.filePath) {
        await Share.open({
          url: \`file://\${file.filePath}\`,
          title: 'Bilan Mensuel des Stocks',
          message: 'Voici le bilan mensuel des stocks généré par GestStock IT.',
          type: 'application/pdf',
        });
      }

    } catch (error) {
      console.error('[PDFReportService] Erreur:', error);
      throw error;
    }
  }
};
