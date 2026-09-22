const fs = require('fs');

const items = [
  { name: 'Scanner Doc Fi 6130/ZLA', qty: 5 },
  { name: 'Kit Clavier / Souris SF Cherry (siège)', qty: 4 },
  { name: 'Casque SF EPOS', qty: 3 },
  { name: 'Casque filaire (Poly + Plantronics)', qty: 13 },
  { name: 'Station Dell (docking)', qty: 14 },
  { name: 'Alim Dell 65W', qty: 14 },
  { name: 'Alim Dell 65W Panini', qty: 4 },
  { name: 'Alim Dell 130W', qty: 8 },
  { name: 'Souris filaire Dell', qty: 10 },
  { name: 'Clavier filaire Dell', qty: 6 },
  { name: 'Sacoche Dell', qty: 11 },
  { name: 'Sac à dos Dell', qty: 2 },
  { name: 'Câble écran usb C', qty: 6 },
  { name: 'Câble charge clavier souris SF usb C vers A', qty: 24 },
  { name: 'Câble charge usb C vers A', qty: 6 },
  { name: 'Câble charge usb C vers C', qty: 2 },
  { name: 'Câble charge usb B vers A', qty: 4 },
  { name: 'Dongle Clavier/Souris Cherry', qty: 28 },
  { name: 'Base Casque SF Poly + Plantronics', qty: 21 },
  { name: 'Base Casque SF Epos', qty: 1 },
  { name: 'Casque SF Poly + Plantronics', qty: 1 },
  { name: 'Cable MICKEY (C5 / IEC 320)', qty: 25 },
  { name: 'HUB Fiche USB C', qty: 6 },
  { name: 'RJ45 2 mètre', qty: 63 },
  { name: 'RJ45 3 mètre', qty: 37 },
  { name: 'RJ45 5 mètre', qty: 7 },
  { name: 'RJ45 10 mètre', qty: 7 }
];

const articles = JSON.parse(fs.readFileSync('articles_dump.json', 'utf8'));

// Simple manual mapping based on keywords
const mappings = {
  'Scanner Doc Fi 6130/ZLA': 'Scanner document', // Or 'Scanner doc'
  'Kit Clavier / Souris SF Cherry (siège)': 'Kit clavier souris > Souris SF + clavier SF CHERRY',
  'Casque SF EPOS': 'Casque EPOS',
  'Casque filaire (Poly + Plantronics)': 'Casque filaire',
  'Station Dell (docking)': 'D6000',
  'Alim Dell 65W': 'Chargeur USB-C DELL 65W',
  'Alim Dell 65W Panini': 'Alimentation Mini UC OPTIPLEX (90W fiche 4,5x3,0mm)', // Or maybe something else?
  'Alim Dell 130W': 'Chargeur D6000 130W',
  'Souris filaire Dell': 'Souris filaire DELL',
  'Clavier filaire Dell': 'Clavier F',
  'Sacoche Dell': 'Sacoche',
  'Sac à dos Dell': 'Sac à dos',
  'Câble écran usb C': 'Câble USB-C / USB-C 2 M',
  'Câble charge clavier souris SF usb C vers A': 'Câble USB-C / USB-A',
  'Câble charge usb C vers A': 'Câble USB-C / USB-A',
  'Câble charge usb C vers C': 'Câble USB-C / USB-C 2 M',
  'Câble charge usb B vers A': 'Câble USB-A / Micro-USB 1 mètre', // Maybe?
  'Dongle Clavier/Souris Cherry': 'Dongle Clavier / Souris CHERRY',
  'Base Casque SF Poly + Plantronics': 'BASE Casque SF V1', // Assuming V1
  'Base Casque SF Epos': 'Base de charge EPOS',
  'Casque SF Poly + Plantronics': 'Casque SF Plantronics V1', // Assuming V1
  'Cable MICKEY (C5 / IEC 320)': 'Câble MICKEY (C5 / IEC 320)',
  'HUB Fiche USB C': 'HUB Fiche USB C',
  'RJ45 2 mètre': 'RJ45 2 mètre blanc',
  'RJ45 3 mètre': 'RJ45 3 mètre blanc', // Need to check if exists
  'RJ45 5 mètre': 'RJ45 5 mètre blanc',
  'RJ45 10 mètre': 'RJ45 10 mètre blanc' // Need to check if exists
};

for (const item of items) {
  let mappedName = mappings[item.name];
  let found = articles.find(a => a.name.toLowerCase() === mappedName?.toLowerCase());
  
  if (!found) {
    // Try fuzzy searching
    found = articles.find(a => a.name.toLowerCase().includes(item.name.toLowerCase().split(' ')[0]));
  }
  
  console.log(`[${found ? 'OK' : 'MISSING'}] ${item.name} -> ${found ? found.name : '???'}`);
}
