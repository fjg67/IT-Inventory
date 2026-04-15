/**
 * Script pour envoyer les emails de mise à jour v2.15 à tous les utilisateurs
 * Utilise Supabase comme BDD et SendGrid ou un service d'emailing
 * 
 * Usage: node send-update-emails.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Configuration email - à adapter selon votre service
const EMAIL_CONFIG = {
  service: process.env.EMAIL_SERVICE || 'gmail', // ou 'sendgrid'
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
};

// Alternative avec SendGrid
// const sgMail = require('@sendgrid/mail');
// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Lit le template HTML
 */
function getEmailTemplate() {
  const templatePath = path.join(__dirname, '../email-templates/update-notification.html');
  return fs.readFileSync(templatePath, 'utf-8');
}

/**
 * Récupère tous les utilisateurs avec leurs emails
 */
async function getAllUsers() {
  console.log('📋 Récupération des utilisateurs...');
  
  const { data: users, error } = await supabase
    .from('email_list')
    .select('id, email, first_name')
    .not('email', 'is', null);

  if (error) {
    console.error('❌ Erreur lors de la récupération des utilisateurs:', error);
    return [];
  }

  console.log(`✅ ${users.length} utilisateurs trouvés`);
  return users;
}

/**
 * Envoie un email via Nodemailer
 */
async function sendEmailViaNodemailer(to, subject, htmlContent) {
  try {
    const transporter = nodemailer.createTransport(EMAIL_CONFIG);

    await transporter.sendMail({
      from: `IT_Inventory <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent,
      replyTo: process.env.EMAIL_REPLY_TO || process.env.EMAIL_USER,
    });

    return { success: true };
  } catch (error) {
    console.error(`❌ Erreur envoi email à ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Envoie un email via SendGrid (alternative)
 */
async function sendEmailViaSendGrid(to, subject, htmlContent) {
  try {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    await sgMail.send({
      to,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject,
      html: htmlContent,
      replyTo: process.env.EMAIL_REPLY_TO,
    });

    return { success: true };
  } catch (error) {
    const details = error?.response?.body?.errors
      ?.map((e) => e.message)
      ?.join(' | ');
    const message = details || error.message;
    console.error(`❌ Erreur SendGrid pour ${to}:`, message);
    return { success: false, error: message };
  }
}

/**
 * Envoie les emails en batch avec délai pour éviter les limitations
 */
async function sendEmailsToBatch(users, template, delayMs = 500) {
  const subject = '📱 IT_Inventory v2.15 - Mise à jour majeure disponible !';
  
  let successCount = 0;
  let failureCount = 0;
  const errors = [];

  console.log(`\n📧 Envoi des emails (délai: ${delayMs}ms entre chaque)...\n`);

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    
    // Personnaliser le template avec le nom de l'utilisateur
    const personalized = template.replace(
      'Bonjour 👋,',
      `Bonjour ${user.first_name || 'utilisateur'} 👋,`
    );

    // Choisir la méthode d'envoi
    const method = process.env.EMAIL_SERVICE === 'sendgrid' 
      ? 'SendGrid' 
      : 'Nodemailer';

    const result = process.env.EMAIL_SERVICE === 'sendgrid'
      ? await sendEmailViaSendGrid(user.email, subject, personalized)
      : await sendEmailViaNodemailer(user.email, subject, personalized);

    if (result.success) {
      successCount++;
      console.log(`✅ [${i + 1}/${users.length}] Email envoyé à ${user.email}`);
    } else {
      failureCount++;
      errors.push({ email: user.email, error: result.error });
      console.log(`❌ [${i + 1}/${users.length}] Échec pour ${user.email}`);
    }

    // Délai entre les envois
    if (i < users.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return { successCount, failureCount, errors };
}

/**
 * Journalise les résultats dans la base de données
 */
async function logEmailCampaign(results) {
  const { error } = await supabase
    .from('email_campaigns')
    .insert({
      campaign_name: 'IT_Inventory v2.15 Update',
      success_count: results.successCount,
      failure_count: results.failureCount,
      total_count: results.successCount + results.failureCount,
      status: 'completed',
      sent_at: new Date().toISOString(),
      errors: results.errors.length > 0 ? JSON.stringify(results.errors) : null,
    });

  if (error) {
    console.error('⚠️ Impossible de journaliser la campagne:', error);
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Démarrage de l\'envoi des emails de mise à jour\n');
  console.log('=' .repeat(60));

  try {
    // Vérification des configurations
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Variables SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises');
    }

    if (process.env.EMAIL_SERVICE === 'sendgrid') {
      if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
        throw new Error('Variables SENDGRID_API_KEY et SENDGRID_FROM_EMAIL requises pour SendGrid');
      }
    } else if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      throw new Error('Variables EMAIL_USER et EMAIL_PASSWORD requises pour SMTP/Gmail');
    }

    // Récupérer le template
    const template = getEmailTemplate();

    // Récupérer les utilisateurs
    const users = await getAllUsers();
    if (users.length === 0) {
      console.log('⚠️ Aucun utilisateur à notifier');
      return;
    }

    // Envoyer les emails
    const results = await sendEmailsToBatch(users, template, 500); // 500ms de délai

    // Afficher le résumé
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 RÉSUMÉ DE LA CAMPAGNE');
    console.log(`✅ Succès: ${results.successCount}`);
    console.log(`❌ Échecs: ${results.failureCount}`);
    console.log(`📈 Taux de réussite: ${((results.successCount / (results.successCount + results.failureCount)) * 100).toFixed(2)}%`);

    if (results.errors.length > 0) {
      console.log(`\n⚠️ Erreurs détectées:`);
      results.errors.forEach(err => {
        console.log(`  - ${err.email}: ${err.error}`);
      });
    }

    // Journaliser dans la BDD
    await logEmailCampaign(results);
    console.log('\n✅ Résultats journalisés dans la base de données');

  } catch (error) {
    console.error('❌ Erreur fatale:', error.message);
    process.exit(1);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Procédé terminé\n');
}

// Lancer le script
main();
