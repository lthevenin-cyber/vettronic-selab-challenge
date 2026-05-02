import { useMemo, useState } from "react";

const STORAGE_KEY = "vettronic_selab_challenge_participants_v2";
const LEGACY_STORAGE_KEY = "vettronic_selab_challenge_participants_v1";
const LOTS_KEY = "vettronic_selab_challenge_lots_v1";
const SETTINGS_KEY = "vettronic_selab_challenge_livestock_settings_v1";
const ADMIN_PIN = "2026";

const DEFAULT_LIVESTOCK_SETTINGS = {
  identificationPrice: 15000,
  theftReductionPercent: 60,
  diseaseReductionPercent: 30,
};

const LOT_CATEGORY_LABELS = {
  "ultra-premium": "Lot ultra prémium",
  premium: "Lot prémium",
  standard: "Lot standard",
  "identification-offerte": "Identification offerte",
  lost: "Vous avez perdu, retentez votre chance",
};

const LOT_PRIORITY = ["ultra-premium", "premium", "standard"];

const profiles = [
  { id: "pet-owner", title: "Propriétaire d'animal", subtitle: "Chien, chat ou cheval", icon: "🐶", game: "lostPet" },
  { id: "dog-breeder", title: "Éleveur canin", subtitle: "Portées, ventes et suivi sanitaire", icon: "🐕", game: "dogBreeder" },
  { id: "livestock-owner", title: "Propriétaire de bétail", subtitle: "Bovins, ovins, caprins, porcins", icon: "🐄", game: "livestockCalculator" },
  { id: "veterinarian", title: "Vétérinaire", subtitle: "Suivi sanitaire et conformité", icon: "🩺", game: "veterinary" },
  { id: "visitor", title: "Visiteur", subtitle: "Je découvre l'identification animale", icon: "🎯", game: "quiz" },
  { id: "identifier-candidate", title: "Futur identificateur", subtitle: "Je veux participer au déploiement terrain", icon: "📡", game: "identifier" },
];

const animalTypes = ["Chien", "Chat", "Cheval", "Bovin", "Ovin", "Caprin", "Porcin", "Volaille", "Autre"];
const selabAnimalTypes = ["Chien", "Chat", "Cheval", "Bovin", "Ovin", "Caprin", "Porcin", "Autre"];

const defaultLots = [
  {
    id: "lot-ultra-premium",
    name: "Kit Ultra Premium Vet'Tronic",
    category: "ultra-premium",
    initialStock: 100,
    remainingStock: 100,
    minScore: 70,
    minAnimals: 200,
    profiles: ["livestock-owner"],
    requiresAnimalPresent: false,
    active: true,
  },
  {
    id: "lot-premium-eleveur",
    name: "Kit Premium Éleveur Vet'Tronic",
    category: "premium",
    initialStock: 200,
    remainingStock: 200,
    minScore: 60,
    minAnimals: 50,
    profiles: ["livestock-owner", "dog-breeder"],
    requiresAnimalPresent: false,
    active: true,
  },
  {
    id: "lot-standard-goodie",
    name: "Goodie Standard Vet'Tronic",
    category: "standard",
    initialStock: 500,
    remainingStock: 500,
    minScore: 50,
    minAnimals: 0,
    profiles: ["all"],
    requiresAnimalPresent: false,
    active: true,
  },
  {
    id: "lot-identification-offerte",
    name: "Identification RFID offerte",
    category: "identification-offerte",
    initialStock: 50,
    remainingStock: 50,
    minScore: 50,
    minAnimals: 1,
    profiles: ["pet-owner", "dog-breeder", "livestock-owner"],
    requiresAnimalPresent: true,
    active: true,
  },
];

const lostPetScenarios = [
  {
    scenario: "Animal perdu",
    icon: "🐕",
    context: "Un chien nommé Rex a été retrouvé près du marché d'Abobo. Plusieurs personnes affirment le connaître, mais seul le numéro de puce permet de retrouver son vrai propriétaire.",
    dataTitle: "Fiche animal retrouvé",
    data: [
      ["Animal", "Rex"],
      ["Espèce", "Chien"],
      ["Race", "Berger allemand"],
      ["Numéro RFID", "384 000 247 901 155"],
      ["Commune de découverte", "Abobo"],
      ["Statut sanitaire", "Vaccin rage à jour"],
    ],
    question: "Qui est le vrai propriétaire de Rex ?",
    choices: [
      ["A", "Mme Diarra — Commune : Yopougon — Aucun numéro RFID enregistré"],
      ["B", "M. Konan — Commune : Abobo — RFID : 384 000 247 901 155 — Téléphone enregistré"],
      ["C", "M. Kouamé — Commune : Bouaké — RFID : 384 000 555 112 009"],
    ],
    answer: "B",
    message: "Grâce à la puce RFID, Rex retrouve son propriétaire officiel. Sans identification, il aurait pu être perdu, vendu ou revendiqué par une autre personne.",
  },
  {
    scenario: "Chien mordeur",
    icon: "🚨",
    context: "Un chien a mordu une personne à Cocody. Les autorités sanitaires doivent identifier rapidement le propriétaire.",
    dataTitle: "Dossier incident",
    data: [
      ["Incident", "Morsure déclarée"],
      ["Lieu", "Cocody"],
      ["Animal", "Chien mâle Rocky"],
      ["Race", "Malinois"],
      ["RFID", "384 000 889 421 673"],
      ["Date de morsure", "14 avril 2026"],
    ],
    question: "Qui est le propriétaire officiel de Rocky ?",
    choices: [
      ["A", "M. Traoré — Commune : Cocody — RFID : 384 000 889 421 673 — Téléphone disponible"],
      ["B", "Mme Bamba — Commune : Marcory — RFID : 384 000 111 222 333"],
      ["C", "Propriétaire inconnu — Aucune donnée disponible"],
    ],
    answer: "A",
    message: "Dans un cas de morsure, l'identification permet d'identifier rapidement le propriétaire et de déclencher le suivi nécessaire.",
  },
  {
    scenario: "Contrôle rage",
    icon: "💉",
    context: "La fiche sanitaire de Rocky est ouverte après l'incident. Le statut vaccinal doit être vérifié immédiatement.",
    dataTitle: "Suivi sanitaire",
    data: [
      ["Vaccin rage", "Dernière vaccination : 20 mars 2025"],
      ["Validité", "1 an"],
      ["Statut au 14 avril 2026", "Expiré"],
      ["Alerte sanitaire", "Contrôle vétérinaire obligatoire"],
    ],
    question: "Le chien est-il à jour de son vaccin rage ?",
    choices: [
      ["A", "Oui, il est conforme"],
      ["B", "Non, le vaccin est expiré"],
      ["C", "Impossible à savoir sans dossier papier"],
    ],
    answer: "B",
    message: "Si le vaccin rage n'est pas à jour, les autorités peuvent déclencher immédiatement le suivi vétérinaire nécessaire.",
  },
  {
    scenario: "Concours international",
    icon: "🏆",
    context: "Une propriétaire de chien est sélectionnée pour un grand concours international. Avant le voyage, les autorités demandent la puce et le suivi sanitaire.",
    dataTitle: "Dossier voyage de Bella",
    data: [
      ["Événement", "Grand Concours Canin International"],
      ["Destination", "Maroc"],
      ["Animal", "Bella, Berger allemand"],
      ["RFID", "384 000 772 900 456"],
      ["Propriétaire", "Mme Amani Kouassi"],
      ["Voyage prévu", "8 juin 2026"],
      ["Fiche sanitaire", "Puce conforme, vaccin rage à jour, dossier complet"],
    ],
    question: "Que permettent la puce et le dossier Vet'Tronic dans ce cas ?",
    choices: [
      ["A", "Vérifier l'identité de Bella et son suivi sanitaire avant le voyage"],
      ["B", "Remplacer totalement les autorités sanitaires"],
      ["C", "Modifier le nom du propriétaire sans contrôle"],
      ["D", "Voyager sans vaccin"],
    ],
    answer: "A",
    message: "Pour voyager ou participer à un concours international, l'animal doit être identifié officiellement et présenter un suivi sanitaire conforme.",
  },
];

const dogBreederScenarios = [
  {
    scenario: "Naissance d'une portée",
    icon: "🐾",
    context: "Une portée de chiots vient de naître. L'éleveur doit préparer leur suivi officiel.",
    dataTitle: "Mission",
    data: [["Action", "Associer chaque chiot à une identité unique"], ["Portée", "6 chiots Berger allemand"], ["Éleveur", "Élevage Amani"]],
    question: "Pourquoi identifier les chiots dès le début ?",
    choices: [["A", "Pour relier chaque chiot à son origine, son éleveur et son suivi sanitaire"], ["B", "Pour choisir leur couleur"], ["C", "Pour éviter toute vaccination"], ["D", "Pour changer leur identité plus tard"]],
    answer: "A",
    message: "Chaque chiot doit pouvoir être relié à son origine, son éleveur et son suivi sanitaire. L'identification donne de la valeur et de la crédibilité à l'élevage.",
  },
  {
    scenario: "Vente sécurisée",
    icon: "🤝",
    context: "Un acheteur vient chercher un chiot. L'éleveur doit remettre le bon dossier.",
    dataTitle: "Dossier chiot",
    data: [["Chiot", "Oslo"], ["Race", "Berger allemand"], ["RFID", "384 000 321 654 987"], ["Éleveur", "Élevage Amani"], ["Vaccins", "Primo-vaccination enregistrée"], ["Traitements", "Vermifuge enregistré"]],
    question: "Quelle preuve sécurise la vente du chiot ?",
    choices: [["A", "Le numéro RFID enregistré dans le dossier de l'animal"], ["B", "Une simple photo"], ["C", "Une déclaration orale"], ["D", "Le prix de vente uniquement"]],
    answer: "A",
    message: "La puce RFID et le dossier numérique sécurisent la vente, évitent les litiges et rassurent l'acheteur.",
  },
  {
    scenario: "Suivi vaccinal avant départ",
    icon: "🧾",
    context: "Un chiot doit rejoindre sa nouvelle famille. Le dossier sanitaire doit être vérifié avant le départ.",
    dataTitle: "Check-list départ",
    data: [["Identification", "À vérifier"], ["Éleveur", "À rattacher"], ["Vaccins", "À jour"], ["Traitements", "Historique visible"]],
    question: "Que doit contenir le dossier avant la vente ?",
    choices: [["A", "Identification, éleveur, propriétaire, vaccins, traitements et historique sanitaire"], ["B", "Seulement le nom du chiot"], ["C", "Seulement une photo"], ["D", "Rien, si l'acheteur est d'accord"]],
    answer: "A",
    message: "Un chiot identifié et correctement suivi inspire confiance. Il protège l'acheteur, l'éleveur et l'animal.",
  },
  {
    scenario: "Élevage reconnu",
    icon: "⭐",
    context: "Deux élevages sont comparés par un acheteur.",
    dataTitle: "Comparaison",
    data: [["Élevage A", "Chiots non identifiés, suivi papier incomplet, origine difficile à vérifier"], ["Élevage B", "Chiots identifiés, dossier sanitaire clair, origine tracée, suivi structuré"]],
    question: "Quel élevage inspire le plus confiance ?",
    choices: [["A", "Élevage A"], ["B", "Élevage B"], ["C", "Les deux pareil"], ["D", "Aucun"]],
    answer: "B",
    message: "L'identification renforce la crédibilité, la traçabilité et la valeur commerciale de l'élevage.",
  },
];

const vetScenarios = [
  {
    scenario: "Vaccin rage expiré",
    icon: "🩺",
    context: "Un chien identifié arrive en consultation. Sa fiche montre que le vaccin rage est expiré.",
    dataTitle: "Fiche Sultan",
    data: [["Nom", "Sultan"], ["RFID", "384 000 700 221 908"], ["Propriétaire", "Mme Yao"], ["Dernière vaccination rage", "2 février 2025"], ["Validité", "1 an"], ["Contrôle", "15 mars 2026"], ["Statut", "Expiré"]],
    question: "Que doit faire le vétérinaire ?",
    choices: [["A", "Valider l'animal comme conforme"], ["B", "Mettre à jour le vaccin et le dossier sanitaire"], ["C", "Supprimer la fiche"], ["D", "Changer le numéro RFID"]],
    answer: "B",
    message: "L'identification permet de lier l'animal à son statut sanitaire réel. Un dossier non à jour doit déclencher une action vétérinaire.",
  },
  {
    scenario: "Suspicion de maladie",
    icon: "🧬",
    context: "Plusieurs animaux d'un élevage présentent des symptômes compatibles avec une maladie contagieuse. Certains animaux ont été déplacés récemment.",
    dataTitle: "Alerte élevage",
    data: [["Symptômes", "Fièvre et abattement"], ["Mouvements", "Déplacements récents"], ["Risque", "Propagation possible"]],
    question: "Quelle information est essentielle pour agir rapidement ?",
    choices: [["A", "Les mouvements des animaux"], ["B", "La couleur des boucles"], ["C", "Le nom du village uniquement"], ["D", "L'âge du propriétaire"]],
    answer: "A",
    message: "Le suivi des mouvements permet de retrouver les animaux exposés, d'alerter les zones concernées et de limiter la propagation.",
  },
  {
    scenario: "Certificat sanitaire",
    icon: "📄",
    context: "Un propriétaire souhaite vendre ou déplacer un animal. Le vétérinaire doit vérifier identité, propriétaire, statut vaccinal et historique.",
    dataTitle: "Contrôle avant certificat",
    data: [["Identité", "RFID"], ["Propriétaire", "À confirmer"], ["Vaccins", "À vérifier"], ["Historique", "Dossier national"]],
    question: "Pourquoi un dossier numérique national est-il utile avant de valider un certificat sanitaire ?",
    choices: [["A", "Pour vérifier les informations en un seul endroit"], ["B", "Pour éviter tout contrôle"], ["C", "Pour modifier les données sans justification"], ["D", "Pour remplacer le vétérinaire"]],
    answer: "A",
    message: "Un dossier sanitaire national facilite le travail vétérinaire et sécurise les décisions officielles.",
  },
  {
    scenario: "Alerte zoonose",
    icon: "🛡️",
    context: "Une zoonose est suspectée dans une zone. Les autorités sanitaires doivent identifier rapidement les animaux concernés.",
    dataTitle: "Réponse sanitaire",
    data: [["Besoin", "Identifier les animaux concernés"], ["Objectif", "Cibler les contrôles"], ["Données utiles", "Localisation, propriétaire, historique, mouvements"]],
    question: "Quel système aide le plus à cibler les contrôles ?",
    choices: [["A", "Une base nationale d'identification et de suivi sanitaire"], ["B", "Des carnets papier dispersés"], ["C", "Des déclarations orales"], ["D", "Aucune donnée"]],
    answer: "A",
    message: "Vet'Tronic relie identification, localisation, propriétaire, historique sanitaire et mouvements pour aider à réduire les risques de zoonoses.",
  },
];

const quizScenarios = [
  {
    scenario: "La puce n'est pas un GPS",
    icon: "📡",
    context: "Un visiteur pense qu'une puce RFID permet de suivre son chien en direct sur une carte.",
    dataTitle: "Idée reçue",
    data: [["RFID", "Numéro unique lu par un lecteur"], ["GPS", "Localisation en temps réel"], ["Vet'Tronic", "Identification officielle"]],
    question: "Une puce RFID Vet'Tronic permet-elle de localiser un animal en temps réel comme un GPS ?",
    choices: [["A", "Oui"], ["B", "Non"]],
    answer: "B",
    message: "La puce RFID ne suit pas l'animal à distance. Elle contient un numéro unique qui permet d'identifier officiellement l'animal lorsqu'il est scanné.",
  },
  {
    scenario: "Un animal sans identité",
    icon: "🪪",
    context: "Deux chiens se ressemblent. L'un est identifié, l'autre non. Une personne affirme être propriétaire du chien non identifié, mais elle n'a aucune preuve.",
    dataTitle: "Comparaison",
    data: [["Chien A", "Puce RFID et propriétaire enregistré"], ["Chien B", "Aucune preuve officielle"]],
    question: "Quel animal est le plus facile à restituer à son vrai propriétaire ?",
    choices: [["A", "Le chien identifié par puce"], ["B", "Le chien sans puce"], ["C", "Les deux pareil"], ["D", "Aucun"]],
    answer: "A",
    message: "L'identification donne une preuve officielle. Elle évite les contestations et protège le propriétaire comme l'animal.",
  },
  {
    scenario: "Le consommateur protégé",
    icon: "🍽️",
    context: "Un animal d'élevage entre dans la chaîne alimentaire. Les autorités veulent connaître son origine, ses déplacements et son suivi sanitaire.",
    dataTitle: "Traçabilité",
    data: [["Origine", "Élevage de départ"], ["Mouvements", "Déplacements suivis"], ["Santé", "Historique sanitaire"]],
    question: "Pourquoi la traçabilité du bétail est-elle utile pour la population ?",
    choices: [["A", "Pour connaître l'origine sanitaire de l'animal"], ["B", "Pour décorer les animaux"], ["C", "Pour augmenter les contrôles sans raison"], ["D", "Pour remplacer les vétérinaires"]],
    answer: "A",
    message: "La traçabilité protège le consommateur. Elle permet de suivre l'animal de la naissance jusqu'à l'abattage.",
  },
  {
    scenario: "La maladie circule",
    icon: "🔎",
    context: "Une maladie animale est détectée dans une zone. Certains animaux sont identifiés, d'autres non.",
    dataTitle: "Recherche rapide",
    data: [["Animaux identifiés", "Retrouvables par numéro et propriétaire"], ["Animaux non identifiés", "Contrôle plus difficile"]],
    question: "Quels animaux seront les plus faciles à retrouver et contrôler rapidement ?",
    choices: [["A", "Les animaux identifiés"], ["B", "Les animaux non identifiés"], ["C", "Uniquement les animaux les plus gros"], ["D", "Aucun"]],
    answer: "A",
    message: "Quand les animaux sont identifiés, les autorités peuvent mieux cibler les contrôles, limiter la propagation des maladies et protéger la population.",
  },
];

const identifierScenarios = [
  {
    scenario: "Arrivée dans un village",
    icon: "🏘️",
    context: "L'agent identificateur arrive dans un village pour une campagne officielle. Plusieurs éleveurs attendent.",
    dataTitle: "Début de campagne",
    data: [["Lieu", "Village pilote"], ["Mission", "Identification officielle"], ["Risque", "Données propriétaire incorrectes"]],
    question: "Quelle est la première chose à faire ?",
    choices: [["A", "Poser directement les boucles"], ["B", "Vérifier l'identité du propriétaire ou détenteur"], ["C", "Demander uniquement le nombre d'animaux"], ["D", "Repartir si l'éleveur n'a pas de carnet"]],
    answer: "B",
    message: "Une identification fiable commence par l'enregistrement correct du propriétaire ou détenteur.",
  },
  {
    scenario: "Pose de la boucle RFID",
    icon: "🏷️",
    context: "Un bovin doit être identifié. L'agent a une boucle RFID conforme ISO et l'application mobile Vet'Tronic.",
    dataTitle: "Matériel terrain",
    data: [["Animal", "Bovin"], ["Boucle", "RFID conforme ISO"], ["Application", "Vet'Tronic mobile"]],
    question: "Que doit faire l'agent après la pose de la boucle ?",
    choices: [["A", "Enregistrer le numéro RFID dans le logiciel"], ["B", "Garder le numéro sur papier uniquement"], ["C", "Donner la boucle à l'éleveur sans enregistrement"], ["D", "Changer le numéro"]],
    answer: "A",
    message: "La boucle seule ne suffit pas. Elle doit être reliée à une fiche animal dans la base nationale.",
  },
  {
    scenario: "Mauvaise information",
    icon: "⚠️",
    context: "Un éleveur donne une information incomplète ou contradictoire sur l'animal.",
    dataTitle: "Contrôle qualité",
    data: [["Donnée manquante", "Origine de l'animal"], ["Contradiction", "Âge déclaré incohérent"], ["Impact", "Traçabilité faussée"]],
    question: "Que doit faire l'identificateur ?",
    choices: [["A", "Enregistrer quand même sans vérifier"], ["B", "Demander une vérification ou une correction avant validation"], ["C", "Inventer l'information manquante"], ["D", "Supprimer la fiche"]],
    answer: "B",
    message: "La qualité des données est essentielle. Une mauvaise information peut fausser la traçabilité et le suivi sanitaire.",
  },
  {
    scenario: "Synchronisation des données",
    icon: "☁️",
    context: "Après une journée de terrain, l'agent a identifié plusieurs animaux dans une zone avec peu de réseau.",
    dataTitle: "Fin de journée",
    data: [["Identifications", "Plusieurs fiches locales"], ["Réseau", "Connexion retrouvée"], ["Objectif", "Rendre les données exploitables"]],
    question: "Que doit-il faire dès qu'il retrouve une connexion ?",
    choices: [["A", "Synchroniser les données"], ["B", "Effacer les données locales"], ["C", "Recommencer toutes les identifications"], ["D", "Envoyer les informations par message vocal uniquement"]],
    answer: "A",
    message: "Le travail terrain doit remonter vers la base nationale pour que l'identification soit exploitable par le ministère, les vétérinaires et les autorités.",
  },
];

function initialContact() {
  return {
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    city: "",
    region: "",
    profession: "",
    animalTypes: [],
    animalCount: "",
    alreadyIdentified: "",
    favorable: "",
    animalsAtSelab: "",
    selabAnimalCount: "",
    selabAnimalTypes: [],
    contactConsent: false,
  };
}

function safeJsonParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function readParticipants() {
  const current = safeJsonParse(localStorage.getItem(STORAGE_KEY), null);
  if (Array.isArray(current)) return current;
  return safeJsonParse(localStorage.getItem(LEGACY_STORAGE_KEY), []);
}

function writeParticipants(rows) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

function readSettings() {
  return { ...DEFAULT_LIVESTOCK_SETTINGS, ...safeJsonParse(localStorage.getItem(SETTINGS_KEY), {}) };
}

function writeSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function normalizeLot(lot) {
  return {
    ...lot,
    initialStock: Number(lot.initialStock || 0),
    remainingStock: Number(lot.remainingStock || 0),
    minScore: Number(lot.minScore || 0),
    minAnimals: Number(lot.minAnimals || 0),
    profiles: Array.isArray(lot.profiles) && lot.profiles.length ? lot.profiles : ["all"],
    requiresAnimalPresent: Boolean(lot.requiresAnimalPresent),
    active: Boolean(lot.active),
  };
}

function readLots() {
  const saved = safeJsonParse(localStorage.getItem(LOTS_KEY), null);
  if (Array.isArray(saved) && saved.length) return saved.map(normalizeLot);
  localStorage.setItem(LOTS_KEY, JSON.stringify(defaultLots));
  return defaultLots.map(normalizeLot);
}

function writeLots(lots) {
  localStorage.setItem(LOTS_KEY, JSON.stringify(lots.map(normalizeLot)));
}

function formatCurrency(value) {
  return `${new Intl.NumberFormat("fr-FR").format(Math.round(Number(value || 0)))} FCFA`;
}

function csvEscape(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function isProfileCompatible(lot, profileId) {
  return lot.profiles.includes("all") || lot.profiles.includes(profileId);
}

function isAnimalPresent(contact) {
  return contact?.animalsAtSelab === "Oui" && Number(contact?.selabAnimalCount || 0) > 0;
}

function assignPrize({ score, contact, profileId }) {
  const lots = readLots();
  const activeCompatible = lots.filter((lot) => lot.active && lot.remainingStock > 0 && isProfileCompatible(lot, profileId));
  const minRequired = activeCompatible.length ? Math.min(...activeCompatible.map((lot) => lot.minScore)) : Infinity;
  if (!activeCompatible.length || score < minRequired) return { prize: lostPrize(), lots };

  const identificationLot = activeCompatible.find((lot) => lot.category === "identification-offerte");
  if (
    identificationLot &&
    isAnimalPresent(contact) &&
    score >= identificationLot.minScore &&
    Number(contact.animalCount || 0) >= identificationLot.minAnimals
  ) {
    return consumeLot(lots, identificationLot.id, "Félicitations ! Vous bénéficiez d'une identification RFID offerte. Présentez votre animal à l'équipe Vet'Tronic pour finaliser l'identification.");
  }

  for (const category of LOT_PRIORITY) {
    const candidates = activeCompatible
      .filter((lot) => lot.category === category && score >= lot.minScore && Number(contact.animalCount || 0) >= lot.minAnimals)
      .sort((a, b) => b.minAnimals - a.minAnimals || b.minScore - a.minScore);
    if (candidates[0]) {
      return consumeLot(lots, candidates[0].id, `Bravo, vous avez gagné ! Lot : ${candidates[0].name}. Présentez cet écran à l'équipe Vet'Tronic pour récupérer votre lot.`);
    }
  }

  return { prize: lostPrize(), lots };
}

function consumeLot(lots, lotId, message) {
  const updated = lots.map((lot) => {
    if (lot.id !== lotId) return lot;
    return { ...lot, remainingStock: Math.max(0, Number(lot.remainingStock || 0) - 1) };
  });
  writeLots(updated);
  const lot = updated.find((item) => item.id === lotId);
  return {
    lots: updated,
    prize: {
      won: true,
      lotId: lot.id,
      category: lot.category,
      categoryLabel: LOT_CATEGORY_LABELS[lot.category],
      lotName: lot.name,
      stockRemainingAfterWin: lot.remainingStock,
      message,
    },
  };
}

function lostPrize() {
  return {
    won: false,
    lotId: null,
    category: "lost",
    categoryLabel: LOT_CATEGORY_LABELS.lost,
    lotName: "Vous avez perdu, retentez votre chance",
    stockRemainingAfterWin: null,
    message: "Vous avez perdu, retentez votre chance. Merci d'avoir participé au VET'TRONIC SELAB Challenge.",
  };
}

function downloadCSV(rows) {
  const flatRows = rows.map((r) => ({
    date_heure: r.createdAt,
    prenom: r.contact?.firstName,
    nom: r.contact?.lastName,
    telephone: r.contact?.phone,
    email: r.contact?.email,
    commune: r.contact?.city,
    region: r.contact?.region,
    profession: r.contact?.profession,
    profil: r.profileTitle,
    types_animaux_possedes: r.contact?.animalTypes?.join("; "),
    nombre_total_animaux: r.contact?.animalCount,
    animaux_presents_selab: r.contact?.animalsAtSelab,
    nombre_animaux_presents_selab: r.contact?.selabAnimalCount,
    types_animaux_presents_selab: r.contact?.selabAnimalTypes?.join("; "),
    animaux_deja_identifies: r.contact?.alreadyIdentified,
    favorable_identification: r.contact?.favorable,
    jeu_joue: r.game,
    score_final: r.score,
    label_final: r.resultLabel,
    gagnant_perdant: r.prize?.won ? "gagnant" : "perdant",
    categorie_lot: r.prize?.categoryLabel,
    nom_precis_lot: r.prize?.lotName,
    stock_restant_lot_au_gain: r.prize?.stockRemainingAfterWin,
    resume_pedagogique: r.summary,
    espece_betail: r.livestock?.species,
    nombre_tetes: r.livestock?.headCount,
    valeur_par_tete: r.livestock?.valuePerHead,
    valeur_cheptel: r.livestock?.herdValue,
    pertes_vol: r.livestock?.theftLosses,
    pertes_maladie: r.livestock?.diseaseLosses,
    perte_sans_identification: r.livestock?.totalLossWithoutIdentification,
    economie_avec_identification: r.livestock?.totalSavingWithIdentification,
    cout_identification: r.livestock?.identificationCost,
    reduction_vol_pourcent: r.livestock?.theftReductionPercent,
    reduction_maladie_pourcent: r.livestock?.diseaseReductionPercent,
  }));
  const headers = Object.keys(flatRows[0] || { vide: "" });
  const csv = [headers.map(csvEscape).join(";"), ...flatRows.map((row) => headers.map((h) => csvEscape(row[h])).join(";"))].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `vettronic-selab-challenge-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [screen, setScreen] = useState("home");
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [contact, setContact] = useState(initialContact());
  const [lastResult, setLastResult] = useState(null);

  function startProfile(profile) {
    setSelectedProfile(profile);
    setContact(initialContact());
    setScreen("contact");
  }

  function launchGame() {
    const ownsAnimals = Number(contact.animalCount || 0) > 0 || contact.animalTypes.length > 0;
    if (!contact.firstName || !contact.phone || !contact.city || !contact.animalCount || !contact.alreadyIdentified || !contact.favorable || !contact.contactConsent) {
      alert("Merci de renseigner le prénom, le téléphone, la commune, le nombre total d'animaux, les champs obligatoires et le consentement.");
      return;
    }
    if (ownsAnimals && !contact.animalsAtSelab) {
      alert("Merci d'indiquer si vos animaux sont avec vous au SELAB.");
      return;
    }
    if (contact.animalsAtSelab === "Oui" && (!contact.selabAnimalCount || !contact.selabAnimalTypes.length)) {
      alert("Merci d'indiquer combien d'animaux sont avec vous au SELAB et lesquels.");
      return;
    }
    setScreen(selectedProfile.game);
  }

  function finishGame(payload) {
    const prizeResult = assignPrize({ score: payload.score, contact, profileId: selectedProfile?.id });
    const record = {
      id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : String(Date.now()),
      createdAt: new Date().toISOString(),
      profileId: selectedProfile?.id,
      profileTitle: selectedProfile?.title,
      game: selectedProfile?.game,
      contact,
      prize: prizeResult.prize,
      won: prizeResult.prize.won,
      ...payload,
    };
    writeParticipants([record, ...readParticipants()]);
    setLastResult(record);
    setScreen("result");
  }

  return (
    <div className="min-h-screen bg-[#f8fffb] text-vet-ink">
      <Header onHome={() => setScreen("home")} onAdmin={() => setScreen("admin")} />
      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 md:py-8">
        {screen === "home" && <Home onStart={startProfile} />}
        {screen === "contact" && <ContactForm profile={selectedProfile} contact={contact} setContact={setContact} onBack={() => setScreen("home")} onContinue={launchGame} />}
        {screen === "lostPet" && <ScenarioGame title="Retrouve mon maître" scenarios={lostPetScenarios} labeler={lostPetLabel} summary="Le participant a été sensibilisé à la recherche du propriétaire, à la gestion d'un chien mordeur, à la vérification du vaccin rage et à la conformité sanitaire avant voyage international." onFinish={finishGame} />}
        {screen === "dogBreeder" && <ScenarioGame title="Élevage canin certifié" scenarios={dogBreederScenarios} labeler={dogBreederLabel} summary="Le participant a été sensibilisé à la traçabilité des portées, à la sécurité des ventes, au suivi sanitaire et à la valeur commerciale de l'élevage." onFinish={finishGame} />}
        {screen === "veterinary" && <ScenarioGame title="Défi Vétérinaire sanitaire" scenarios={vetScenarios} labeler={vetLabel} summary="Le participant a été sensibilisé au suivi vaccinal, aux mouvements d'animaux, au certificat sanitaire et aux alertes zoonoses." onFinish={finishGame} />}
        {screen === "quiz" && <ScenarioGame title="Défi Identification" scenarios={quizScenarios} labeler={genericLabel} summary="Le participant a été sensibilisé à la différence RFID/GPS, à la preuve de propriété, à la traçabilité alimentaire et au contrôle des maladies." onFinish={finishGame} />}
        {screen === "identifier" && <ScenarioGame title="Mission Agent identificateur" scenarios={identifierScenarios} labeler={identifierLabel} summary="Le participant a été sensibilisé à l'enregistrement du détenteur, à la pose RFID, à la qualité des données et à la synchronisation terrain." onFinish={finishGame} />}
        {screen === "livestockCalculator" && <LivestockGame onFinish={finishGame} />}
        {screen === "result" && <Result record={lastResult} onRestart={() => setScreen("home")} />}
        {screen === "admin" && <AdminPanel />}
      </main>
    </div>
  );
}

function Header({ onHome, onAdmin }) {
  return (
    <header className="sticky top-0 z-20 border-b border-vet-green/20 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <button onClick={onHome} className="flex min-w-0 items-center gap-3 text-left" aria-label="Retour à l'accueil">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-vet-green/25">
            <img src="/logo-vettronic.png" alt="Logo Vet'Tronic" className="h-full w-full object-contain" />
          </span>
          <span className="min-w-0">
            <span className="block text-[0.68rem] font-black uppercase tracking-widest text-vet-teal">VET'TRONIC</span>
            <span className="block text-lg font-black leading-tight text-vet-ink sm:text-2xl">SELAB Challenge</span>
          </span>
        </button>
        <button onClick={onAdmin} className="min-h-12 rounded-full border border-vet-teal/25 bg-white px-4 py-2 text-sm font-black text-vet-teal shadow-sm transition hover:bg-vet-teal hover:text-white">
          Admin
        </button>
      </div>
    </header>
  );
}

function Home({ onStart }) {
  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-[2rem] bg-vet-ink shadow-soft">
        <div className="grid gap-6 p-5 text-white sm:p-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <p className="inline-flex rounded-full bg-vet-sun px-4 py-2 text-sm font-black text-vet-ink">SELAB 2026 · Côte d'Ivoire · Code pays 384</p>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight sm:text-6xl">VET'TRONIC SELAB Challenge</h1>
            <p className="mt-4 max-w-2xl text-lg text-white/85">Une expérience interactive pour comprendre, jouer, gagner et découvrir pourquoi l'identification animale protège un vrai capital.</p>
            <div className="mt-5 inline-flex rounded-2xl bg-white px-4 py-3 text-base font-black text-vet-teal">Prix fixe par défaut : {formatCurrency(DEFAULT_LIVESTOCK_SETTINGS.identificationPrice)} par animal</div>
          </div>
          <div className="grid gap-3 rounded-[1.75rem] bg-white/10 p-4">
            {[
              ["🎁", "Lots automatiques selon score et profil"],
              ["📱", "Stockage local sur chaque tablette"],
              ["🏅", "Identification offerte prioritaire si l'animal est présent"],
            ].map(([icon, text]) => (
              <div key={text} className="flex items-center gap-3 rounded-2xl bg-white p-4 text-vet-ink">
                <span className="text-3xl">{icon}</span>
                <span className="font-black">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-2xl font-black">Choisissez votre profil</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <button key={profile.id} onClick={() => onStart(profile)} className="group min-h-44 rounded-[1.5rem] bg-white p-5 text-left shadow-sm ring-1 ring-vet-green/25 transition hover:-translate-y-1 hover:shadow-soft focus:outline-none focus:ring-4 focus:ring-vet-sun">
              <div className="mb-3 text-5xl transition group-hover:scale-110">{profile.icon}</div>
              <h3 className="text-xl font-black">{profile.title}</h3>
              <p className="mt-1 text-slate-600">{profile.subtitle}</p>
              <div className="mt-5 inline-flex rounded-full bg-vet-blue/10 px-4 py-2 text-sm font-black text-vet-blue">Commencer →</div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactForm({ profile, contact, setContact, onBack, onContinue }) {
  function update(key, value) {
    setContact((c) => ({ ...c, [key]: value }));
  }

  function toggleIn(key, value) {
    const current = contact[key] || [];
    update(key, current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  const showSelabDetails = contact.animalsAtSelab === "Oui";

  return (
    <section className="mx-auto max-w-4xl rounded-[2rem] bg-white p-5 shadow-soft ring-1 ring-vet-green/20 sm:p-7">
      <button onClick={onBack} className="mb-4 min-h-11 rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-vet-ink">← Retour</button>
      <div className="mb-6 flex items-center gap-4">
        <div className="text-5xl">{profile?.icon}</div>
        <div>
          <p className="text-sm font-black uppercase tracking-widest text-vet-teal">Profil sélectionné</p>
          <h2 className="text-3xl font-black">{profile?.title}</h2>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Prénom *" value={contact.firstName} onChange={(v) => update("firstName", v)} />
        <Input label="Nom" value={contact.lastName} onChange={(v) => update("lastName", v)} />
        <Input label="Téléphone WhatsApp *" inputMode="tel" value={contact.phone} onChange={(v) => update("phone", v)} />
        <Input label="Email" type="email" value={contact.email} onChange={(v) => update("email", v)} />
        <Input label="Commune / ville *" value={contact.city} onChange={(v) => update("city", v)} />
        <Input label="Région" value={contact.region} onChange={(v) => update("region", v)} />
        <Input label="Profession / activité" value={contact.profession} onChange={(v) => update("profession", v)} />
        <Input label="Combien d'animaux avez-vous au total ? *" type="number" value={contact.animalCount} onChange={(v) => update("animalCount", v)} />
      </div>

      <ChipGroup title="Quels animaux possédez-vous ?" values={animalTypes} selected={contact.animalTypes} onToggle={(type) => toggleIn("animalTypes", type)} />

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Select label="Vos animaux sont-ils déjà identifiés ? *" value={contact.alreadyIdentified} onChange={(v) => update("alreadyIdentified", v)} options={["Oui", "Non", "Partiellement", "Je ne sais pas"]} />
        <Select label="Êtes-vous favorable à l'identification ? *" value={contact.favorable} onChange={(v) => update("favorable", v)} options={["Oui", "Non", "Besoin d'explication", "Je ne sais pas"]} />
        <Select label="Vos animaux sont-ils avec vous au SELAB ? *" value={contact.animalsAtSelab} onChange={(v) => update("animalsAtSelab", v)} options={["Oui", "Non"]} />
        {showSelabDetails && <Input label="Combien d'animaux sont avec vous au SELAB ? *" type="number" value={contact.selabAnimalCount} onChange={(v) => update("selabAnimalCount", v)} />}
      </div>

      {showSelabDetails && <ChipGroup title="Quels animaux sont avec vous au SELAB ? *" values={selabAnimalTypes} selected={contact.selabAnimalTypes} onToggle={(type) => toggleIn("selabAnimalTypes", type)} />}

      <label className="mt-6 flex gap-3 rounded-2xl bg-vet-green/15 p-4 text-sm text-slate-700">
        <input type="checkbox" checked={contact.contactConsent} onChange={(e) => update("contactConsent", e.target.checked)} className="mt-1 h-6 w-6 shrink-0 accent-vet-teal" />
        <span>J'accepte que Vet'Tronic conserve mes informations sur cette tablette pendant le SELAB et puisse me recontacter concernant l'identification animale.</span>
      </label>
      <button onClick={onContinue} className="mt-8 min-h-14 w-full rounded-2xl bg-vet-teal px-6 py-4 text-lg font-black text-white shadow-lg transition hover:bg-vet-ink">Jouer maintenant 🎮</button>
    </section>
  );
}

function ChipGroup({ title, values, selected, onToggle }) {
  return (
    <div className="mt-6">
      <p className="mb-3 font-black">{title}</p>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <button key={value} onClick={() => onToggle(value)} className={`min-h-11 rounded-full px-4 py-2 text-sm font-black ring-1 transition ${selected.includes(value) ? "bg-vet-teal text-white ring-vet-teal" : "bg-white text-slate-700 ring-slate-200"}`}>
            {value}
          </button>
        ))}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", inputMode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-black text-slate-700">{label}</span>
      <input type={type} inputMode={inputMode} value={value} onChange={(e) => onChange(e.target.value)} className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-vet-sun/60 transition focus:ring-4" />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-black text-slate-700">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-vet-sun/60 transition focus:ring-4">
        <option value="">Sélectionner</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function ScenarioGame({ title, scenarios, labeler, summary, onFinish }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState("");
  const [feedback, setFeedback] = useState(null);
  const item = scenarios[index];

  function choose(choice) {
    const good = choice === item.answer;
    setSelected(choice);
    setFeedback({ good, message: item.message });
  }

  function next() {
    const updated = [...answers, feedback.good];
    if (index + 1 < scenarios.length) {
      setAnswers(updated);
      setSelected("");
      setFeedback(null);
      setIndex(index + 1);
      return;
    }
    const goodCount = updated.filter(Boolean).length;
    const score = Math.round((goodCount / scenarios.length) * 100);
    onFinish({ score, resultLabel: labeler(goodCount), summary: `${summary} Score : ${goodCount}/${scenarios.length}.` });
  }

  return (
    <section className="mx-auto max-w-5xl rounded-[2rem] bg-white p-5 shadow-soft ring-1 ring-vet-green/20 sm:p-7">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-widest text-vet-teal">Scénario {index + 1}/{scenarios.length}</p>
          <h2 className="text-3xl font-black">{title}</h2>
        </div>
        <span className="rounded-full bg-vet-sun px-4 py-2 text-sm font-black text-vet-ink">{item.scenario}</span>
      </div>
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[1.7rem] bg-vet-ink p-5 text-white">
          <div className="text-7xl">{item.icon}</div>
          <h3 className="mt-4 text-2xl font-black">{item.scenario}</h3>
          <p className="mt-3 text-white/85">{item.context}</p>
          <div className="mt-5 rounded-2xl bg-white p-4 text-vet-ink">
            <p className="mb-3 font-black">{item.dataTitle}</p>
            <div className="grid gap-2">
              {item.data.map(([label, value]) => <InfoLine key={label} label={label} value={value} />)}
            </div>
          </div>
        </div>
        <div>
          <div className="rounded-[1.5rem] bg-slate-50 p-5">
            <p className="text-2xl font-black leading-snug">{item.question}</p>
          </div>
          <div className="mt-4 grid gap-3">
            {item.choices.map(([id, label]) => (
              <button key={id} disabled={Boolean(feedback)} onClick={() => choose(id)} className={`min-h-16 rounded-2xl p-4 text-left font-black ring-1 transition ${selected === id ? (feedback?.good ? "bg-vet-teal text-white ring-vet-teal" : "bg-vet-coral text-white ring-vet-coral") : "bg-white ring-slate-200 hover:bg-vet-blue/10"}`}>
                <span className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-vet-ink">{id}</span>{label}
              </button>
            ))}
          </div>
          {feedback && (
            <div className={`mt-5 rounded-2xl p-5 ${feedback.good ? "bg-vet-green/15" : "bg-vet-sun/25"}`}>
              <p className="text-xl font-black">{feedback.good ? "Bonne réponse !" : "Ce n'est pas la bonne réponse."}</p>
              <p className="mt-2 text-slate-700">{feedback.message}</p>
              <button onClick={next} className="mt-5 min-h-12 rounded-2xl bg-vet-ink px-6 py-3 font-black text-white">Continuer →</button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function InfoLine({ label, value }) {
  return (
    <div className="flex flex-col rounded-xl bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm font-black text-slate-500">{label}</span>
      <span className="font-black text-vet-ink">{value}</span>
    </div>
  );
}

function LivestockGame({ onFinish }) {
  const settings = readSettings();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ species: "Bovin", headCount: "", valuePerHead: "", theftLosses: "", diseaseLosses: "", alreadyIdentified: "Non", transhumance: "Non", annualSales: "" });

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const calc = useMemo(() => calculateLivestock(form, settings), [form, settings]);

  function finish() {
    const complete = form.species && form.headCount && form.valuePerHead && form.theftLosses !== "" && form.diseaseLosses !== "" && form.alreadyIdentified && form.transhumance;
    const partial = form.species && form.headCount && form.valuePerHead;
    const score = complete ? 100 : partial ? 70 : 40;
    onFinish({
      score,
      resultLabel: complete ? "Éleveur protecteur" : partial ? "Éleveur en progression" : "Découverte du capital animal",
      livestock: { ...form, ...calc, identificationPrice: settings.identificationPrice, theftReductionPercent: settings.theftReductionPercent, diseaseReductionPercent: settings.diseaseReductionPercent },
      summary: `Sans identification : perte réelle de ${formatCurrency(calc.totalLossWithoutIdentification)} par an. Avec identification : économie estimée de ${formatCurrency(calc.totalSavingWithIdentification)} par an. Coût de l'identification Vet'Tronic : ${formatCurrency(calc.identificationCost)}. L'identification n'est pas une simple dépense, c'est une protection du capital animal sur plusieurs années.`,
    });
  }

  const screens = [
    <LivestockStepOne form={form} update={update} calc={calc} />,
    <LivestockStepTwo form={form} update={update} calc={calc} settings={settings} />,
    <LivestockStepThree form={form} update={update} calc={calc} settings={settings} />,
    <LivestockStepFour form={form} update={update} calc={calc} settings={settings} />,
  ];

  return (
    <section className="mx-auto max-w-5xl rounded-[2rem] bg-white p-5 shadow-soft ring-1 ring-vet-green/20 sm:p-7">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-widest text-vet-teal">Scénario {step + 1}/4</p>
          <h2 className="text-3xl font-black">Mon troupeau, mon capital</h2>
        </div>
        <span className="rounded-full bg-vet-sun px-4 py-2 text-sm font-black text-vet-ink">{form.species}</span>
      </div>
      {screens[step]}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
        <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="min-h-12 rounded-2xl bg-slate-100 px-6 py-3 font-black text-vet-ink disabled:opacity-40">Retour</button>
        {step < 3 ? (
          <button onClick={() => setStep(step + 1)} className="min-h-12 rounded-2xl bg-vet-teal px-6 py-3 font-black text-white">Continuer →</button>
        ) : (
          <button onClick={finish} className="min-h-12 rounded-2xl bg-vet-ink px-6 py-3 font-black text-white">Voir mon résultat 🏆</button>
        )}
      </div>
    </section>
  );
}

function calculateLivestock(form, settings) {
  const headCount = Number(form.headCount || 0);
  const valuePerHead = Number(form.valuePerHead || 0);
  const theftLosses = Number(form.theftLosses || 0);
  const diseaseLosses = Number(form.diseaseLosses || 0);
  const herdValue = headCount * valuePerHead;
  const theftAnnualLoss = theftLosses * valuePerHead;
  const diseaseAnnualLoss = diseaseLosses * valuePerHead;
  const totalLossWithoutIdentification = theftAnnualLoss + diseaseAnnualLoss;
  const theftSavingWithIdentification = theftAnnualLoss * (Number(settings.theftReductionPercent || 0) / 100);
  const diseaseSavingWithIdentification = diseaseAnnualLoss * (Number(settings.diseaseReductionPercent || 0) / 100);
  const totalSavingWithIdentification = theftSavingWithIdentification + diseaseSavingWithIdentification;
  const estimatedLossWithIdentification = totalLossWithoutIdentification - totalSavingWithIdentification;
  const identificationCost = headCount * Number(settings.identificationPrice || 0);
  const lossesWithoutIdentification3Years = totalLossWithoutIdentification * 3;
  const savingsWithIdentification3Years = totalSavingWithIdentification * 3;
  return { headCount, valuePerHead, theftLosses, diseaseLosses, herdValue, theftAnnualLoss, diseaseAnnualLoss, totalLossWithoutIdentification, theftSavingWithIdentification, diseaseSavingWithIdentification, totalSavingWithIdentification, estimatedLossWithIdentification, identificationCost, lossesWithoutIdentification3Years, savingsWithIdentification3Years };
}

function LivestockStepOne({ form, update, calc }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-4">
        <Select label="Type principal d'élevage" value={form.species} onChange={(v) => update("species", v)} options={["Bovin", "Ovin", "Caprin", "Porcin", "Mixte"]} />
        <Input label="Nombre moyen de têtes par an" type="number" value={form.headCount} onChange={(v) => update("headCount", v)} />
        <Input label="Valeur moyenne par tête en FCFA" type="number" value={form.valuePerHead} onChange={(v) => update("valuePerHead", v)} />
      </div>
      <VisualCard icon="💰" title="Votre troupeau = votre capital" tone="blue">
        <Metric label="Nombre de têtes" value={calc.headCount} />
        <Metric label="Valeur moyenne par tête" value={formatCurrency(calc.valuePerHead)} />
        <Metric label="Valeur totale du cheptel" value={formatCurrency(calc.herdValue)} highlight />
        <p className="mt-4 rounded-2xl bg-white p-4 font-bold text-vet-ink">Votre élevage représente un capital économique important. Plus ce capital est important, plus il doit être protégé par une identification fiable.</p>
      </VisualCard>
    </div>
  );
}

function LivestockStepTwo({ form, update, calc, settings }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
      <Input label="Nombre de têtes volées par an" type="number" value={form.theftLosses} onChange={(v) => update("theftLosses", v)} />
      <Comparison redTitle="Sans identification" redValue={`Perte réelle liée au vol : ${formatCurrency(calc.theftAnnualLoss)} / an`} greenTitle="Avec identification" greenValue={`Économie estimée sur pertes par vol : ${formatCurrency(calc.theftSavingWithIdentification)} / an`} note={`Réduction paramétrée : ${settings.theftReductionPercent} %. Un animal identifié est rattaché à un propriétaire, à un élevage et à un numéro officiel.`} />
    </div>
  );
}

function LivestockStepThree({ form, update, calc, settings }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
      <Input label="Nombre de têtes perdues par maladie par an" type="number" value={form.diseaseLosses} onChange={(v) => update("diseaseLosses", v)} />
      <Comparison redTitle="Sans identification" redValue={`Perte réelle liée aux maladies : ${formatCurrency(calc.diseaseAnnualLoss)} / an`} greenTitle="Avec identification" greenValue={`Économie estimée sur pertes sanitaires : ${formatCurrency(calc.diseaseSavingWithIdentification)} / an`} note={`Réduction paramétrée : ${settings.diseaseReductionPercent} %. Le suivi sanitaire devient plus précis et les zones à risque sont mieux ciblées.`} />
    </div>
  );
}

function LivestockStepFour({ form, update, calc, settings }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <Select label="Animaux déjà identifiés ?" value={form.alreadyIdentified} onChange={(v) => update("alreadyIdentified", v)} options={["Oui", "Non", "Partiellement"]} />
        <Select label="Transhumance ?" value={form.transhumance} onChange={(v) => update("transhumance", v)} options={["Oui", "Non"]} />
        <Input label="Ventes annuelles approximatives (optionnel)" type="number" value={form.annualSales} onChange={(v) => update("annualSales", v)} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <VisualCard icon="🔴" title="Sans identification" tone="red">
          <Metric label="Perte réelle annuelle" value={`${formatCurrency(calc.totalLossWithoutIdentification)} / an`} highlight />
          <p className="mt-3 text-sm font-bold">Animaux plus difficiles à retrouver. Revente frauduleuse plus facile. Suivi sanitaire plus difficile. Risques plus élevés.</p>
        </VisualCard>
        <VisualCard icon="🟢" title="Avec identification" tone="green">
          <Metric label="Économie estimée" value={`${formatCurrency(calc.totalSavingWithIdentification)} / an`} highlight />
          <p className="mt-3 text-sm font-bold">Propriété plus facile à prouver. Maladies mieux ciblées. Suivi sanitaire renforcé.</p>
        </VisualCard>
        <VisualCard icon="🔵" title="Coût Vet'Tronic" tone="blue">
          <Metric label="Prix par animal" value={formatCurrency(settings.identificationPrice)} />
          <Metric label="Coût total" value={formatCurrency(calc.identificationCost)} highlight />
        </VisualCard>
      </div>
      <div className="rounded-2xl bg-vet-sun/30 p-5 font-black text-vet-ink">
        <p>Sans identification : perte réelle de {formatCurrency(calc.totalLossWithoutIdentification)} par an</p>
        <p>Avec identification : économie estimée de {formatCurrency(calc.totalSavingWithIdentification)} par an</p>
        <p>Coût de l'identification Vet'Tronic : {formatCurrency(calc.identificationCost)}</p>
        <p className="mt-3">L'identification n'est pas une simple dépense. C'est une protection de votre capital animal sur plusieurs années.</p>
      </div>
    </div>
  );
}

function VisualCard({ icon, title, children, tone }) {
  const classes = {
    red: "bg-red-50 ring-red-200",
    green: "bg-emerald-50 ring-emerald-200",
    blue: "bg-sky-50 ring-sky-200",
  };
  return (
    <div className={`rounded-[1.5rem] p-5 ring-1 ${classes[tone] || classes.blue}`}>
      <div className="text-6xl">{icon}</div>
      <h3 className="mt-3 text-2xl font-black">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Comparison({ redTitle, redValue, greenTitle, greenValue, note }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-[1.5rem] bg-red-50 p-5 ring-1 ring-red-200">
        <div className="text-5xl">🔴</div>
        <h3 className="mt-3 text-2xl font-black text-red-800">{redTitle}</h3>
        <p className="mt-3 text-lg font-black">{redValue}</p>
      </div>
      <div className="rounded-[1.5rem] bg-emerald-50 p-5 ring-1 ring-emerald-200">
        <div className="text-5xl">🟢</div>
        <h3 className="mt-3 text-2xl font-black text-emerald-800">{greenTitle}</h3>
        <p className="mt-3 text-lg font-black">{greenValue}</p>
        <p className="mt-4 rounded-2xl bg-white p-4 text-sm font-bold text-vet-ink">{note}</p>
      </div>
    </div>
  );
}

function Metric({ label, value, highlight }) {
  return (
    <div className={`mb-2 flex items-center justify-between gap-3 rounded-2xl p-4 ${highlight ? "bg-white text-vet-ink shadow-sm" : "bg-white/70"}`}>
      <span className="text-sm font-black text-slate-600">{label}</span>
      <span className="text-right text-lg font-black">{value}</span>
    </div>
  );
}

function Result({ record, onRestart }) {
  if (!record) return null;
  const prize = record.prize || lostPrize();
  return (
    <section className="mx-auto max-w-3xl rounded-[2rem] bg-white p-5 text-center shadow-soft ring-1 ring-vet-green/20 sm:p-7">
      <div className={`mx-auto flex h-28 w-28 items-center justify-center rounded-full text-6xl ${prize.won ? "bg-vet-sun" : "bg-slate-100"}`}>{prize.won ? "🎁" : "🎯"}</div>
      <p className="mt-6 text-sm font-black uppercase tracking-widest text-vet-teal">Résultat enregistré</p>
      <h2 className="mt-2 text-4xl font-black">{record.resultLabel}</h2>
      <p className="mt-3 text-2xl font-black text-vet-teal">Score : {record.score}%</p>
      <div className={`mt-5 rounded-2xl p-5 text-left ${prize.won ? "bg-vet-green/15" : "bg-vet-sun/25"}`}>
        <p className="text-2xl font-black">{prize.won ? "Bravo, vous avez gagné !" : "Vous avez perdu, retentez votre chance."}</p>
        <p className="mt-2 font-black">Lot : {prize.lotName}</p>
        <p>Catégorie : {prize.categoryLabel}</p>
        {prize.stockRemainingAfterWin !== null && <p>Stock restant après gain : {prize.stockRemainingAfterWin}</p>}
        <p className="mt-3">{prize.message}</p>
      </div>
      <p className="mt-5 rounded-2xl bg-slate-50 p-5 text-left text-slate-700">{record.summary}</p>
      <button onClick={onRestart} className="mt-8 min-h-14 w-full rounded-2xl bg-vet-teal px-6 py-4 text-lg font-black text-white shadow-lg hover:bg-vet-ink">Nouvelle participation →</button>
    </section>
  );
}

function AdminPanel() {
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState("participations");
  const [rows, setRows] = useState(readParticipants());
  const [lots, setLots] = useState(readLots());
  const [settings, setSettings] = useState(readSettings());
  const [hasExported, setHasExported] = useState(false);

  function refresh() {
    setRows(readParticipants());
    setLots(readLots());
    setSettings(readSettings());
  }

  if (!unlocked) {
    return (
      <section className="mx-auto max-w-md rounded-[2rem] bg-white p-5 shadow-soft ring-1 ring-vet-green/20 sm:p-7">
        <h2 className="text-3xl font-black">Espace administrateur</h2>
        <p className="mt-2 text-slate-600">Accès réservé à l'équipe Vet'Tronic.</p>
        <div className="mt-5"><Input label="Code admin" value={pin} onChange={setPin} /></div>
        <button onClick={() => pin === ADMIN_PIN ? setUnlocked(true) : alert("Code incorrect.")} className="mt-5 min-h-14 w-full rounded-2xl bg-vet-ink px-6 py-4 font-black text-white">Entrer</button>
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] bg-white p-5 shadow-soft ring-1 ring-vet-green/20 sm:p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-3xl font-black">Administration SELAB</h2>
          <p className="mt-1 text-slate-600">Données locales de cette tablette uniquement.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            ["participations", "Participations"],
            ["lots", "Gestion des lots"],
            ["settings", "Paramètres bétail"],
          ].map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={`min-h-11 rounded-xl px-4 py-2 font-black ${tab === id ? "bg-vet-teal text-white" : "bg-slate-100 text-vet-ink"}`}>{label}</button>)}
        </div>
      </div>
      {tab === "participations" && <ParticipationsAdmin rows={rows} lots={lots} refresh={refresh} hasExported={hasExported} setHasExported={setHasExported} setRows={setRows} />}
      {tab === "lots" && <LotsAdmin lots={lots} setLots={setLots} />}
      {tab === "settings" && <LivestockSettingsAdmin settings={settings} setSettings={setSettings} />}
    </section>
  );
}

function ParticipationsAdmin({ rows, lots, refresh, hasExported, setHasExported, setRows }) {
  const [filters, setFilters] = useState({ profile: "", win: "", category: "", animalType: "", present: "" });
  const filtered = rows.filter((r) => {
    if (filters.profile && r.profileId !== filters.profile) return false;
    if (filters.win === "gagnant" && !r.prize?.won) return false;
    if (filters.win === "perdant" && r.prize?.won) return false;
    if (filters.category && r.prize?.category !== filters.category) return false;
    if (filters.animalType && !r.contact?.animalTypes?.includes(filters.animalType)) return false;
    if (filters.present && r.contact?.animalsAtSelab !== filters.present) return false;
    return true;
  });
  const assignedByCategory = rows.reduce((acc, r) => ({ ...acc, [r.prize?.category || "lost"]: (acc[r.prize?.category || "lost"] || 0) + 1 }), {});
  const byProfile = profiles.map((p) => `${p.title}: ${rows.filter((r) => r.profileId === p.id).length}`).join(" · ");

  function clearData() {
    if (rows.length && !hasExported) {
      alert("Exportez les données CSV avant de supprimer les participations.");
      return;
    }
    if (confirm("Supprimer toutes les participations stockées sur cette tablette ?")) {
      writeParticipants([]);
      setRows([]);
      setHasExported(false);
    }
  }

  return (
    <div className="mt-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Total" value={rows.length} />
        <Stat label="Gagnants" value={rows.filter((r) => r.prize?.won).length} />
        <Stat label="Perdants" value={rows.filter((r) => !r.prize?.won).length} />
        <Stat label="Lots attribués" value={rows.filter((r) => r.prize?.won).length} />
        <Stat label="Identification offerte" value={rows.filter((r) => r.prize?.category === "identification-offerte").length} />
      </div>
      <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm font-bold">{byProfile}</p>
      <p className="mt-2 rounded-2xl bg-slate-50 p-4 text-sm font-bold">Lots par catégorie : {Object.entries(assignedByCategory).map(([k, v]) => `${LOT_CATEGORY_LABELS[k] || k}: ${v}`).join(" · ") || "Aucun"}</p>

      <div className="mt-5 grid gap-3 md:grid-cols-5">
        <Select label="Profil" value={filters.profile} onChange={(v) => setFilters({ ...filters, profile: v })} options={profiles.map((p) => p.id)} />
        <Select label="Gain" value={filters.win} onChange={(v) => setFilters({ ...filters, win: v })} options={["gagnant", "perdant"]} />
        <Select label="Catégorie lot" value={filters.category} onChange={(v) => setFilters({ ...filters, category: v })} options={Object.keys(LOT_CATEGORY_LABELS)} />
        <Select label="Type animal" value={filters.animalType} onChange={(v) => setFilters({ ...filters, animalType: v })} options={animalTypes} />
        <Select label="Animaux au SELAB" value={filters.present} onChange={(v) => setFilters({ ...filters, present: v })} options={["Oui", "Non"]} />
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={refresh} className="min-h-11 rounded-xl border border-slate-200 px-4 py-2 font-black">Rafraîchir</button>
        <button onClick={() => { downloadCSV(rows); setHasExported(true); }} className="min-h-11 rounded-xl bg-vet-teal px-4 py-2 font-black text-white">Exporter CSV</button>
        <button onClick={clearData} className="min-h-11 rounded-xl bg-vet-coral px-4 py-2 font-black text-white">Supprimer après export</button>
      </div>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50"><tr>{["Date", "Nom", "Téléphone", "Profil", "Animaux", "Score", "Lot", "Résumé"].map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="p-3">{new Date(r.createdAt).toLocaleString("fr-FR")}</td>
                <td className="p-3 font-black">{r.contact?.firstName} {r.contact?.lastName}</td>
                <td className="p-3">{r.contact?.phone}</td>
                <td className="p-3">{r.profileTitle}</td>
                <td className="p-3">{r.contact?.animalTypes?.join(", ")}</td>
                <td className="p-3 font-black text-vet-teal">{r.score}%</td>
                <td className="p-3">{r.prize?.lotName}</td>
                <td className="max-w-md p-3 text-slate-600">{r.summary}</td>
              </tr>
            ))}
            {!filtered.length && <tr><td colSpan="8" className="p-6 text-center text-slate-500">Aucune participation pour ces filtres.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LotsAdmin({ lots, setLots }) {
  const emptyLot = { id: `lot-${Date.now()}`, name: "", category: "standard", initialStock: 0, remainingStock: 0, minScore: 50, minAnimals: 0, profiles: ["all"], requiresAnimalPresent: false, active: true };
  const [draft, setDraft] = useState(emptyLot);

  function saveLot(lot) {
    const normalized = normalizeLot(lot);
    const exists = lots.some((item) => item.id === normalized.id);
    const updated = exists ? lots.map((item) => item.id === normalized.id ? normalized : item) : [...lots, normalized];
    writeLots(updated);
    setLots(updated);
    setDraft({ ...emptyLot, id: `lot-${Date.now()}` });
  }

  function removeLot(id) {
    const updated = lots.filter((lot) => lot.id !== id);
    writeLots(updated);
    setLots(updated);
  }

  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <LotEditor lot={draft} setLot={setDraft} onSave={() => saveLot(draft)} />
      <div className="grid gap-3">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { writeLots(defaultLots); setLots(defaultLots.map(normalizeLot)); }} className="min-h-11 rounded-xl bg-vet-sun px-4 py-2 font-black text-vet-ink">Créer les lots par défaut</button>
        </div>
        {lots.map((lot) => (
          <div key={lot.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xl font-black">{lot.name}</p>
                <p className="text-sm font-bold text-slate-600">{LOT_CATEGORY_LABELS[lot.category]} · Stock {lot.remainingStock}/{lot.initialStock} · Attribués {Math.max(0, lot.initialStock - lot.remainingStock)}</p>
                <p className="text-sm">Score min {lot.minScore}% · Animaux min {lot.minAnimals} · Profils {lot.profiles.join(", ")} · Animal présent : {lot.requiresAnimalPresent ? "Oui" : "Non"} · {lot.active ? "Actif" : "Inactif"}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setDraft(lot)} className="rounded-xl bg-white px-3 py-2 font-black ring-1 ring-slate-200">Modifier</button>
                <button onClick={() => removeLot(lot.id)} className="rounded-xl bg-vet-coral px-3 py-2 font-black text-white">Supprimer</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LotEditor({ lot, setLot, onSave }) {
  function toggleProfile(profile) {
    const profilesList = lot.profiles || [];
    setLot({ ...lot, profiles: profilesList.includes(profile) ? profilesList.filter((item) => item !== profile) : [...profilesList, profile] });
  }
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
      <h3 className="text-2xl font-black">Ajouter / modifier un lot</h3>
      <div className="mt-4 grid gap-3">
        <Input label="Nom précis du lot" value={lot.name} onChange={(v) => setLot({ ...lot, name: v })} />
        <Select label="Catégorie" value={lot.category} onChange={(v) => setLot({ ...lot, category: v })} options={["ultra-premium", "premium", "standard", "identification-offerte"]} />
        <Input label="Stock initial" type="number" value={lot.initialStock} onChange={(v) => setLot({ ...lot, initialStock: v })} />
        <Input label="Stock restant" type="number" value={lot.remainingStock} onChange={(v) => setLot({ ...lot, remainingStock: v })} />
        <Input label="Score minimum requis en %" type="number" value={lot.minScore} onChange={(v) => setLot({ ...lot, minScore: v })} />
        <Input label="Nombre minimum d'animaux requis" type="number" value={lot.minAnimals} onChange={(v) => setLot({ ...lot, minAnimals: v })} />
      </div>
      <ChipGroup title="Profils concernés" values={["all", ...profiles.map((p) => p.id)]} selected={lot.profiles || []} onToggle={toggleProfile} />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Toggle label="Condition animal présent au SELAB" checked={lot.requiresAnimalPresent} onChange={(v) => setLot({ ...lot, requiresAnimalPresent: v })} />
        <Toggle label="Actif" checked={lot.active} onChange={(v) => setLot({ ...lot, active: v })} />
      </div>
      <button onClick={onSave} className="mt-5 min-h-12 w-full rounded-2xl bg-vet-teal px-6 py-3 font-black text-white">Enregistrer le lot</button>
    </div>
  );
}

function LivestockSettingsAdmin({ settings, setSettings }) {
  function save(next) {
    const normalized = {
      identificationPrice: Number(next.identificationPrice || 0),
      theftReductionPercent: Number(next.theftReductionPercent || 0),
      diseaseReductionPercent: Number(next.diseaseReductionPercent || 0),
    };
    writeSettings(normalized);
    setSettings(normalized);
  }
  return (
    <div className="mt-6 max-w-2xl rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
      <h3 className="text-2xl font-black">Paramètres bétail</h3>
      <div className="mt-4 grid gap-4">
        <Input label="Prix identification par animal" type="number" value={settings.identificationPrice} onChange={(v) => setSettings({ ...settings, identificationPrice: v })} />
        <Input label="Réduction estimée des pertes par vol en %" type="number" value={settings.theftReductionPercent} onChange={(v) => setSettings({ ...settings, theftReductionPercent: v })} />
        <Input label="Réduction estimée des pertes par maladie en %" type="number" value={settings.diseaseReductionPercent} onChange={(v) => setSettings({ ...settings, diseaseReductionPercent: v })} />
      </div>
      <button onClick={() => save(settings)} className="mt-5 min-h-12 rounded-2xl bg-vet-teal px-6 py-3 font-black text-white">Enregistrer les paramètres</button>
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4 font-black">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-6 w-6 accent-vet-teal" />
    </label>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5">
      <p className="text-sm font-black text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-black">{value}</p>
    </div>
  );
}

function lostPetLabel(good) {
  if (good === 4) return "Expert identification Vet'Tronic";
  if (good === 3) return "Ambassadeur de l'identification";
  if (good === 2) return "Ami des animaux";
  return "Découverte Vet'Tronic";
}

function dogBreederLabel(good) {
  if (good === 4) return "Éleveur canin certifié";
  if (good === 3) return "Éleveur responsable";
  if (good === 2) return "Éleveur en progression";
  return "Découverte de la traçabilité canine";
}

function vetLabel(good) {
  if (good === 4) return "Expert sanitaire Vet'Tronic";
  if (good === 3) return "Partenaire sanitaire";
  if (good === 2) return "Sensibilisé au suivi sanitaire";
  return "Découverte sanitaire";
}

function genericLabel(good) {
  if (good === 4) return "Expert Traçabilité Vet'Tronic";
  if (good === 3) return "Ambassadeur de l'identification";
  if (good === 2) return "Ami des animaux";
  return "Découverte Vet'Tronic";
}

function identifierLabel(good) {
  if (good === 4) return "Agent identificateur prêt";
  if (good === 3) return "Candidat sérieux";
  if (good === 2) return "Candidat à former";
  return "Découverte du métier";
}
