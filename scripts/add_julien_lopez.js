#!/usr/bin/env node

/**
 * Script d'ajout d'un nouveau technicien
 * Julien LOPEZ (affiché comme: Julien LOPEZ, sans matricule)
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lghhzbkbwttvroxodlzd.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnaGh6Ymtid3R0dnJveG9kbHpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDY0MTI4OSwiZXhwIjoyMDg2MjE3Mjg5fQ.xr9tfTzVavf9SdZfbSN3lGtTmDo19DeE_YZeAqWcwCI';

// Générer un UUID v4
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Générer un technicianId unique (ex: J001, J002, etc.)
function generateTechnicianId() {
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `J${random}`;
}

async function main() {
  console.log('🔄 Connexion à Supabase...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // 1. Récupérer le siteId de Rémi
    console.log('📍 Récupération du site de Rémi...');
    const { data: remiData, error: remiError } = await supabase
      .from('User')
      .select('id, name, siteId')
      .eq('name', 'Remi')
      .limit(1)
      .single();

    if (remiError) {
      throw new Error(`Erreur lors de la récupération de Rémi: ${remiError.message}`);
    }

    if (!remiData) {
      throw new Error('Rémi non trouvé dans la base de données');
    }

    console.log(`✅ Rémi trouvé: Site = ${remiData.siteId}`);

    // 2. Insérer le nouvel utilisateur
    console.log('➕ Insertion du nouvel utilisateur...');
    const newUserId = generateUUID();
    const newTechnicianId = generateTechnicianId();
    const now = new Date().toISOString();
    
    const { data: newUser, error: insertError } = await supabase
      .from('User')
      .insert([
        {
          id: newUserId,
          name: 'Julien LOPEZ',
          technicianId: newTechnicianId,
          role: 'TECHNICIAN',
          isActive: true,
          siteId: remiData.siteId,
          password: '', // Laisser vide
          createdAt: now,
          updatedAt: now,
        },
      ])
      .select();

    if (insertError) {
      throw new Error(`Erreur lors de l'insertion: ${insertError.message}`);
    }

    if (!newUser || newUser.length === 0) {
      throw new Error('Aucune donnée retournée après insertion');
    }

    // 3. Afficher les résultats
    console.log('');
    console.log('✅ SUCCESS! Nouvel utilisateur ajouté:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  ID: ${newUser[0].id}`);
    console.log(`  Nom: ${newUser[0].name}`);
    console.log(`  Matricule: ${newUser[0].technicianId}`);
    console.log(`  Rôle: ${newUser[0].role}`);
    console.log(`  Site: ${newUser[0].siteId}`);
    console.log(`  Actif: ${newUser[0].isActive}`);
    console.log(`  Créé le: ${newUser[0].createdAt}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📝 Notes:');
    console.log('  - Nom affiché: Julien LOPEZ');
    console.log('  - Matricule généré automatiquement');
    console.log('  - Site: reprend celui de Rémi');
    console.log('  - Utilisateur actif et prêt à utiliser');
    console.log('');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

main();
