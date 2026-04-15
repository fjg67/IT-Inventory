#!/usr/bin/env node
/**
 * Validation Script for Notification System
 * 
 * Vérifie que tout est bien configuré avant d'envoyer les notifications.
 * Usage: node scripts/validate-notification-setup.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const CHECKS = {
  ENV: '✓ Variables d\'environnement',
  SUPABASE: '✓ Connexion Supabase',
  DATABASE: '✓ Tables de base de données',
  EMAIL: '✓ Configuration Email',
  FIREBASE: '✓ Configuration Firebase',
};

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(status, message) {
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️ ';
  const color = status === 'pass' ? colors.green : status === 'fail' ? colors.red : colors.yellow;
  console.log(`${color}${icon} ${message}${colors.reset}`);
}

function logSection(title) {
  console.log(`\n${colors.blue}═══ ${title} ═══${colors.reset}`);
}

async function validateEnv() {
  logSection('1. Variables d\'environnement');
  
  const required = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];
  
  const emailRequired = ['EMAIL_USER', 'EMAIL_PASSWORD'];
  const sendgridRequired = ['SENDGRID_API_KEY'];
  
  let passed = 0;
  
  for (const key of required) {
    if (process.env[key]) {
      log('pass', `${key}: configuré`);
      passed++;
    } else {
      log('fail', `${key}: MANQUANT`);
    }
  }
  
  const hasGmail = process.env.EMAIL_USER && process.env.EMAIL_PASSWORD;
  const hasSendgrid = process.env.SENDGRID_API_KEY;
  
  if (hasGmail) {
    log('pass', 'Gmail configuré');
    passed++;
  } else if (hasSendgrid) {
    log('pass', 'SendGrid configuré');
    passed++;
  } else {
    log('fail', 'Email: NEITHER Gmail NOR SendGrid configured');
  }
  
  if (process.env.FIREBASE_API_KEY && process.env.FIREBASE_PROJECT_ID) {
    log('pass', 'Firebase configuré');
    passed++;
  } else {
    log('warn', 'Firebase: optionnel pour push notifications');
  }
  
  return passed >= 3;
}

async function validateSupabase() {
  logSection('2. Connexion Supabase');
  
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Test simple query
    const { data, error } = await supabase.from('users').select('id').limit(1);
    
    if (error && error.code !== 'PGRST103') { // PGRST103 = table doesn't exist yet
      throw error;
    }
    
    log('pass', 'Connexion établie');
    return true;
  } catch (err) {
    log('fail', `Erreur de connexion: ${err.message}`);
    return false;
  }
}

async function validateDatabase() {
  logSection('3. Tables de base de données');
  
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const tables = [
      'email_campaigns',
      'notification_campaigns',
      'user_email_log',
      'user_notification_log',
    ];
    
    let passed = 0;
    
    for (const table of tables) {
      const { error } = await supabase.from(table).select('id').limit(1);
      
      if (error && error.code === 'PGRST116') {
        log('fail', `${table}: NOT FOUND (créer avec la migration SQL)`);
      } else if (error && error.code !== 'PGRST103') {
        log('fail', `${table}: Erreur - ${error.message}`);
      } else {
        log('pass', `${table}: OK`);
        passed++;
      }
    }
    
    return passed >= 3;
  } catch (err) {
    log('fail', `Erreur base de données: ${err.message}`);
    return false;
  }
}

async function validateEmail() {
  logSection('4. Configuration Email');
  
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
      
      await transporter.verify();
      log('pass', 'Gmail authentification OK');
      return true;
    } catch (err) {
      log('fail', `Gmail erreur: ${err.message}`);
      log('warn', 'Vérifier le mot de passe app (16 caractères avec espaces)');
      return false;
    }
  } else if (process.env.SENDGRID_API_KEY) {
    log('pass', 'SendGrid configuré');
    return true;
  } else {
    log('warn', 'Email: non configuré (optionnel si vous utilisez seulement push)');
    return false;
  }
}

async function validateFirebase() {
  logSection('5. Configuration Firebase');
  
  if (process.env.FIREBASE_API_KEY && process.env.FIREBASE_PROJECT_ID) {
    log('pass', 'Firebase configuré');
    log('warn', 'Validation complète requiert une vraie clé de serveur');
    return true;
  } else {
    log('warn', 'Firebase non configuré (optionnel si vous utilisez seulement email)');
    return false;
  }
}

async function showSummary(results) {
  logSection('RÉSUMÉ');
  
  const allPassed = Object.values(results).every(r => r === true);
  
  if (allPassed) {
    console.log(`\n${colors.green}🎉 TOUT EST OK ! Vous pouvez envoyer les notifications.${colors.reset}\n`);
    console.log('Prochaines étapes:');
    console.log('  1. Mode test:  DRY_RUN=true node scripts/send-update-emails.js');
    console.log('  2. Mode réel:  node scripts/send-update-emails.js\n');
    return true;
  } else {
    console.log(`\n${colors.red}⚠️  Certains éléments ne sont pas configurés.${colors.reset}\n`);
    console.log('Problèmes à résoudre:');
    
    if (!results.ENV) console.log('  - Vérifier .env (copier de .env.example)');
    if (!results.SUPABASE) console.log('  - Vérifier SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY');
    if (!results.DATABASE) console.log('  - Exécuter la migration SQL dans Supabase');
    if (!results.EMAIL) console.log('  - Configurer Gmail ou SendGrid dans .env');
    if (!results.FIREBASE) console.log('  - (Optionnel) Configurer Firebase pour push notifications');
    
    console.log('\nVoir QUICK_START_NOTIFICATIONS.md pour plus d\'aide.\n');
    return false;
  }
}

async function main() {
  console.log(`\n${colors.blue}${colors.blue}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║   🔍 NOTIFICATION SYSTEM VALIDATOR   ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════╝${colors.reset}\n`);
  
  try {
    const results = {
      ENV: await validateEnv(),
      SUPABASE: await validateSupabase(),
      DATABASE: await validateDatabase(),
      EMAIL: await validateEmail(),
      FIREBASE: await validateFirebase(),
    };
    
    await showSummary(results);
    
    process.exit(results.ENV && results.SUPABASE ? 0 : 1);
  } catch (err) {
    log('fail', `Erreur critique: ${err.message}`);
    process.exit(1);
  }
}

main();
