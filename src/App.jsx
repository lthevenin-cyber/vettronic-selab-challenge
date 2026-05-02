import { useMemo, useState } from "react";

const PRICE_PER_IDENTIFICATION = 15000;
const STORAGE_KEY = "vettronic_selab_challenge_participants_v1";
const ADMIN_PIN = "2026";

const profiles = [
  {
    id: "pet-owner",
    title: "Propriétaire d'animal",
    subtitle: "Chien, chat ou cheval",
    icon: "🐶",
    game: "lostPet",
  },
  {
    id: "dog-breeder",
    title: "Éleveur canin",
    subtitle: "Chiens d'élevage ou de travail",
    icon: "🐕",
    game: "lostPet",
  },
  {
    id: "livestock-owner",
    title: "Propriétaire de bétail",
    subtitle: "Bovins, ovins, caprins, porcins",
    icon: "🐄",
    game: "livestockCalculator",
  },
  {
    id: "veterinarian",
    title: "Vétérinaire",
    subtitle: "Suivi sanitaire et conformité",
    icon: "🩺",
    game: "veterinary",
  },
  {
    id: "visitor",
    title: "Visiteur",
    subtitle: "Je découvre l'identification animale",
    icon: "🎯",
    game: "quiz",
  },
  {
    id: "identifier-candidate",
    title: "Futur identificateur",
    subtitle: "Je veux participer au déploiement terrain",
    icon: "📡",
    game: "identifier",
  },
];

const quizQuestions = [
  {
    q: "Une puce RFID est une balise GPS qui suit l'animal en temps réel.",
    answer: false,
    explain: "Faux. La puce RFID contient un numéro unique lisible avec un lecteur, mais elle ne géolocalise pas l'animal.",
  },
  {
    q: "L'identification aide à retrouver le propriétaire d'un animal perdu.",
    answer: true,
    explain: "Vrai. Le numéro unique permet de relier l'animal à son propriétaire enregistré.",
  },
  {
    q: "La traçabilité du bétail peut aider à réduire les risques sanitaires.",
    answer: true,
    explain: "Vrai. Elle permet de suivre les mouvements, les vaccinations et les alertes sanitaires.",
  },
  {
    q: "L'identification ne sert qu'aux chiens et aux chats.",
    answer: false,
    explain: "Faux. Elle concerne aussi les bovins, ovins, caprins, porcins et chevaux.",
  },
  {
    q: "Un animal identifié peut avoir un dossier sanitaire national.",
    answer: true,
    explain: "Vrai. Vet'Tronic associe l'identification à un logiciel national de suivi sanitaire.",
  },
];

const veterinaryQuestions = [
  {
    q: "Un chien identifié avec un vaccin rage expiré doit être considéré comme conforme.",
    answer: false,
    explain: "Faux. Le dossier sanitaire doit être mis à jour et la vaccination contrôlée.",
  },
  {
    q: "Une base nationale peut aider le ministère à cibler les zones à risque.",
    answer: true,
    explain: "Vrai. Les données d'identification et de santé permettent d'orienter les contrôles.",
  },
  {
    q: "Le numéro ISO pays permet de rattacher l'identification au cadre national.",
    answer: true,
    explain: "Vrai. En Côte d'Ivoire, les identifiants commenceront par le code pays 384.",
  },
  {
    q: "La traçabilité sanitaire s'arrête à la pose de la puce ou de la boucle.",
    answer: false,
    explain: "Faux. L'intérêt est de suivre l'animal dans le temps : vaccins, traitements, mouvements, maladies.",
  },
];

const identifierQuestions = [
  {
    q: "Un identificateur doit vérifier le propriétaire avant d'enregistrer l'animal.",
    answer: true,
    explain: "Vrai. L'identification fiable commence par l'enregistrement correct du détenteur ou propriétaire.",
  },
  {
    q: "Une boucle ou une puce peut être posée sans synchroniser les données.",
    answer: false,
    explain: "Faux. L'identification doit être associée au logiciel national pour être utile.",
  },
  {
    q: "La formation des identificateurs est essentielle pour fiabiliser la mission nationale.",
    answer: true,
    explain: "Vrai. Vet'Tronic déploie ses propres identificateurs formés.",
  },
];

const animalTypes = ["Chien", "Chat", "Cheval", "Bovin", "Ovin", "Caprin", "Porcin", "Volaille", "Autre"];

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
    contactConsent: false,
  };
}

function readParticipants() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveParticipant(record) {
  const updated = [record, ...readParticipants()];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

function formatCurrency(value) {
  const n = Number(value || 0);
  return `${new Intl.NumberFormat("fr-FR").format(Math.round(n))} FCFA`;
}

function csvEscape(value) {
  const str = String(value ?? "");
  return `"${str.replaceAll('"', '""')}"`;
}

function downloadCSV(rows) {
  const flatRows = rows.map((r) => ({
    date: r.createdAt,
    nom: r.contact?.lastName,
    prenom: r.contact?.firstName,
    telephone: r.contact?.phone,
    email: r.contact?.email,
    commune: r.contact?.city,
    region: r.contact?.region,
    profession: r.contact?.profession,
    profil: r.profileTitle,
    animaux: r.contact?.animalTypes?.join("; "),
    nombre_animaux: r.contact?.animalCount,
    deja_identifies: r.contact?.alreadyIdentified,
    favorable_identification: r.contact?.favorable,
    souhaite_contact: r.contact?.contactConsent ? "oui" : "non",
    jeu: r.game,
    score: r.score,
    resultat: r.resultLabel,
    type_elevage: r.livestock?.species,
    nb_tetes: r.livestock?.headCount,
    valeur_tete: r.livestock?.valuePerHead,
    pertes_vol: r.livestock?.theftLosses,
    pertes_maladie: r.livestock?.diseaseLosses,
    valeur_cheptel: r.livestock?.herdValue,
    pertes_annuelles: r.livestock?.annualLosses,
    cout_identification: r.livestock?.identificationCost,
    conclusion: r.summary,
  }));

  const headers = Object.keys(flatRows[0] || { vide: "" });
  const csv = [
    headers.map(csvEscape).join(";"),
    ...flatRows.map((row) => headers.map((h) => csvEscape(row[h])).join(";")),
  ].join("\n");

  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `vettronic-selab-challenge-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function App() {
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
    if (!contact.firstName || !contact.phone || !contact.city || !contact.contactConsent) {
      alert("Merci de renseigner au minimum le prénom, le téléphone, la commune et l'accord de contact pour participer.");
      return;
    }
    setScreen(selectedProfile.game);
  }

  function finishGame(payload) {
    const record = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      createdAt: new Date().toISOString(),
      profileId: selectedProfile?.id,
      profileTitle: selectedProfile?.title,
      game: selectedProfile?.game,
      contact,
      ...payload,
    };
    saveParticipant(record);
    setLastResult(record);
    setScreen("result");
  }

  return (
    <div className="min-h-screen bg-[#f8fffb] text-vet-ink">
      <Header onHome={() => setScreen("home")} onAdmin={() => setScreen("admin")} />
      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 md:py-8">
        {screen === "home" && <Home onStart={startProfile} />}
        {screen === "contact" && (
          <ContactForm
            profile={selectedProfile}
            contact={contact}
            setContact={setContact}
            onBack={() => setScreen("home")}
            onContinue={launchGame}
          />
        )}
        {screen === "quiz" && <TrueFalseGame title="Défi Identification" questions={quizQuestions} onFinish={finishGame} />}
        {screen === "lostPet" && <LostPetGame onFinish={finishGame} />}
        {screen === "veterinary" && <TrueFalseGame title="Défi Vétérinaire sanitaire" questions={veterinaryQuestions} onFinish={finishGame} />}
        {screen === "identifier" && <TrueFalseGame title="Mission Agent identificateur" questions={identifierQuestions} onFinish={finishGame} />}
        {screen === "livestockCalculator" && <LivestockCalculator onFinish={finishGame} />}
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
        <button
          onClick={onAdmin}
          className="min-h-12 rounded-full border border-vet-teal/25 bg-white px-4 py-2 text-sm font-black text-vet-teal shadow-sm transition hover:bg-vet-teal hover:text-white"
        >
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
        <div className="grid gap-6 p-5 text-white sm:p-8 md:grid-cols-[1.15fr_0.85fr] md:items-center">
          <div>
            <p className="inline-flex rounded-full bg-vet-sun px-4 py-2 text-sm font-black text-vet-ink">
              SELAB 2026 · Côte d'Ivoire · Code pays 384
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight sm:text-6xl">
              VET'TRONIC SELAB Challenge
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-white/85">
              Choisissez votre profil, jouez en quelques minutes et découvrez comment l'identification protège les animaux, les éleveurs et les familles.
            </p>
            <div className="mt-5 inline-flex rounded-2xl bg-white px-4 py-3 text-base font-black text-vet-teal">
              Prix fixe : {formatCurrency(PRICE_PER_IDENTIFICATION)} par animal
            </div>
          </div>
          <div className="grid gap-3 rounded-[1.75rem] bg-white/10 p-4">
            {[
              ["🏆", "Des cadeaux à gagner"],
              ["📍", "Données gardées sur la tablette"],
              ["🟢", "Sans serveur, sans base distante"],
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
            <button
              key={profile.id}
              onClick={() => onStart(profile)}
              className="group min-h-44 rounded-[1.5rem] bg-white p-5 text-left shadow-sm ring-1 ring-vet-green/25 transition hover:-translate-y-1 hover:shadow-soft focus:outline-none focus:ring-4 focus:ring-vet-sun"
            >
              <div className="mb-3 text-5xl transition group-hover:scale-110">{profile.icon}</div>
              <h3 className="text-xl font-black">{profile.title}</h3>
              <p className="mt-1 text-slate-600">{profile.subtitle}</p>
              <div className="mt-5 inline-flex rounded-full bg-vet-blue/10 px-4 py-2 text-sm font-black text-vet-blue">
                Commencer →
              </div>
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

  function toggleAnimal(type) {
    const current = contact.animalTypes || [];
    update("animalTypes", current.includes(type) ? current.filter((x) => x !== type) : [...current, type]);
  }

  return (
    <section className="mx-auto max-w-4xl rounded-[2rem] bg-white p-5 shadow-soft ring-1 ring-vet-green/20 sm:p-7">
      <button onClick={onBack} className="mb-4 min-h-11 rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-vet-ink">
        ← Retour
      </button>
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
        <Input label="Nombre total approximatif d'animaux" type="number" value={contact.animalCount} onChange={(v) => update("animalCount", v)} />
      </div>

      <div className="mt-6">
        <p className="mb-3 font-black">Quels animaux possédez-vous ?</p>
        <div className="flex flex-wrap gap-2">
          {animalTypes.map((type) => (
            <button
              key={type}
              onClick={() => toggleAnimal(type)}
              className={`min-h-11 rounded-full px-4 py-2 text-sm font-black ring-1 transition ${
                contact.animalTypes.includes(type)
                  ? "bg-vet-teal text-white ring-vet-teal"
                  : "bg-white text-slate-700 ring-slate-200"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Select
          label="Vos animaux sont-ils déjà identifiés ?"
          value={contact.alreadyIdentified}
          onChange={(v) => update("alreadyIdentified", v)}
          options={["Oui", "Non", "Partiellement", "Je ne sais pas"]}
        />
        <Select
          label="Êtes-vous favorable à l'identification ?"
          value={contact.favorable}
          onChange={(v) => update("favorable", v)}
          options={["Oui", "Non", "Besoin d'explication", "Je ne sais pas"]}
        />
      </div>

      <label className="mt-6 flex gap-3 rounded-2xl bg-vet-green/15 p-4 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={contact.contactConsent}
          onChange={(e) => update("contactConsent", e.target.checked)}
          className="mt-1 h-6 w-6 shrink-0 accent-vet-teal"
        />
        <span>
          J'accepte que Vet'Tronic conserve mes informations sur cette tablette pendant le SELAB et puisse me recontacter concernant l'identification animale.
        </span>
      </label>

      <button
        onClick={onContinue}
        className="mt-8 min-h-14 w-full rounded-2xl bg-vet-teal px-6 py-4 text-lg font-black text-white shadow-lg transition hover:bg-vet-ink"
      >
        Jouer maintenant 🎮
      </button>
    </section>
  );
}

function Input({ label, value, onChange, type = "text", inputMode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-black text-slate-700">{label}</span>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-vet-sun/60 transition focus:ring-4"
      />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-black text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-vet-sun/60 transition focus:ring-4"
      >
        <option value="">Sélectionner</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TrueFalseGame({ title, questions, onFinish }) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const q = questions[index];

  function answer(value) {
    const good = value === q.answer;
    if (good) setScore((s) => s + 1);
    setFeedback({ good, explain: q.explain });
  }

  function next() {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setFeedback(null);
      return;
    }
    const finalScore = Math.round(((score + (feedback?.good ? 1 : 0)) / questions.length) * 100);
    onFinish({
      score: finalScore,
      resultLabel: labelForScore(finalScore),
      summary: `Score ${finalScore} %. Le participant a été sensibilisé à l'identification RFID, au suivi sanitaire et à la traçabilité nationale.`,
    });
  }

  return (
    <section className="mx-auto max-w-3xl rounded-[2rem] bg-white p-5 shadow-soft ring-1 ring-vet-green/20 sm:p-7">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="text-3xl font-black">{title}</h2>
        <span className="rounded-full bg-vet-sun px-4 py-2 text-sm font-black text-vet-ink">
          {index + 1}/{questions.length}
        </span>
      </div>
      <div className="rounded-[1.5rem] bg-slate-50 p-5">
        <p className="text-2xl font-black leading-snug">{q.q}</p>
      </div>
      {!feedback ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <button onClick={() => answer(true)} className="min-h-20 rounded-2xl bg-vet-teal px-6 py-5 text-2xl font-black text-white shadow-lg">
            Vrai ✅
          </button>
          <button onClick={() => answer(false)} className="min-h-20 rounded-2xl bg-vet-coral px-6 py-5 text-2xl font-black text-white shadow-lg">
            Faux ❌
          </button>
        </div>
      ) : (
        <div className={`mt-6 rounded-2xl p-5 ${feedback.good ? "bg-vet-green/15" : "bg-vet-sun/25"}`}>
          <p className="text-xl font-black">{feedback.good ? "Bonne réponse !" : "Ce n'est pas la bonne réponse."}</p>
          <p className="mt-2 text-slate-700">{feedback.explain}</p>
          <button onClick={next} className="mt-5 min-h-12 rounded-2xl bg-vet-ink px-6 py-3 font-black text-white">
            Continuer →
          </button>
        </div>
      )}
    </section>
  );
}

function LostPetGame({ onFinish }) {
  const [choice, setChoice] = useState(null);
  const good = choice === "konan";

  function finish() {
    onFinish({
      score: good ? 100 : 40,
      resultLabel: good ? "Ambassadeur de l'identification" : "Découverte",
      summary: good
        ? "Le participant a compris qu'une puce RFID permet de rattacher l'animal à son propriétaire enregistré."
        : "Le participant a découvert l'intérêt de l'identification pour retrouver le propriétaire d'un animal perdu.",
    });
  }

  return (
    <section className="mx-auto max-w-4xl rounded-[2rem] bg-white p-5 shadow-soft ring-1 ring-vet-green/20 sm:p-7">
      <h2 className="text-3xl font-black">Retrouve mon maître</h2>
      <p className="mt-2 text-slate-600">Un animal identifié a été retrouvé. À toi de retrouver son vrai propriétaire grâce au numéro RFID.</p>
      <div className="mt-6 grid gap-6 md:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[1.5rem] bg-vet-green/15 p-6 text-center">
          <div className="text-8xl">🐕</div>
          <p className="mt-4 text-xl font-black">Animal retrouvé : Rex</p>
          <p className="mt-2 rounded-xl bg-white p-3 font-mono text-lg font-black">RFID : 384 000 247 901 155</p>
          <p className="mt-3 text-sm text-slate-600">Vaccin rage : à jour · Commune : Abobo</p>
        </div>
        <div className="space-y-3">
          {[
            ["diarra", "Mme Diarra · Yopougon · Aucun numéro RFID"],
            ["konan", "M. Konan · Abobo · RFID 384 000 247 901 155"],
            ["kouame", "M. Kouamé · Bouaké · RFID 384 000 555 112 009"],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setChoice(id)}
              className={`min-h-16 w-full rounded-2xl p-5 text-left font-black ring-1 transition ${
                choice === id ? "bg-vet-teal text-white ring-vet-teal" : "bg-white ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {choice && (
        <div className={`mt-6 rounded-2xl p-5 ${good ? "bg-vet-green/15" : "bg-vet-sun/25"}`}>
          <p className="text-xl font-black">
            {good ? "Bravo ! Rex retrouve son propriétaire." : "Attention : seul le numéro RFID permet de confirmer le propriétaire."}
          </p>
          <p className="mt-2 text-slate-700">
            Sans identification, l'animal peut être perdu, vendu ou revendiqué par une autre personne. Avec Vet'Tronic, son identité est vérifiable.
          </p>
          <button onClick={finish} className="mt-5 min-h-12 rounded-2xl bg-vet-ink px-6 py-3 font-black text-white">
            Voir mon résultat →
          </button>
        </div>
      )}
    </section>
  );
}

function LivestockCalculator({ onFinish }) {
  const [form, setForm] = useState({
    species: "Bovin",
    headCount: "",
    valuePerHead: "",
    theftLosses: "",
    diseaseLosses: "",
    alreadyIdentified: "Non",
  });

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const calc = useMemo(() => {
    const headCount = Number(form.headCount || 0);
    const valuePerHead = Number(form.valuePerHead || 0);
    const theftLosses = Number(form.theftLosses || 0);
    const diseaseLosses = Number(form.diseaseLosses || 0);
    const herdValue = headCount * valuePerHead;
    const theftValue = theftLosses * valuePerHead;
    const diseaseValue = diseaseLosses * valuePerHead;
    const annualLosses = theftValue + diseaseValue;
    const losses3Years = annualLosses * 3;
    const identificationCost = headCount * PRICE_PER_IDENTIFICATION;
    const saving30 = annualLosses * 0.3;
    const saving50 = annualLosses * 0.5;
    const saving70 = annualLosses * 0.7;
    return { headCount, valuePerHead, theftLosses, diseaseLosses, herdValue, theftValue, diseaseValue, annualLosses, losses3Years, identificationCost, saving30, saving50, saving70 };
  }, [form]);

  function finish() {
    if (!form.headCount || !form.valuePerHead) {
      alert("Merci d'indiquer le nombre de têtes et la valeur moyenne par tête.");
      return;
    }
    const score = calc.annualLosses > calc.identificationCost ? 95 : calc.losses3Years > calc.identificationCost ? 85 : 70;
    onFinish({
      score,
      resultLabel: score >= 90 ? "Éleveur protecteur" : "Éleveur en transition",
      livestock: { ...form, ...calc },
      summary: `Cheptel ${form.species}: valeur estimée ${formatCurrency(calc.herdValue)}. Pertes annuelles estimées ${formatCurrency(calc.annualLosses)}. Coût d'identification ${formatCurrency(calc.identificationCost)}. L'identification protège la propriété et améliore le ciblage sanitaire.`,
    });
  }

  return (
    <section className="mx-auto max-w-5xl rounded-[2rem] bg-white p-5 shadow-soft ring-1 ring-vet-green/20 sm:p-7">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-black uppercase tracking-widest text-vet-teal">Jeu éleveur</p>
          <h2 className="mt-1 text-3xl font-black">Mon troupeau, mon capital</h2>
          <p className="mt-3 text-slate-600">Entrez vos chiffres pour voir combien le vol et les maladies peuvent coûter à votre élevage.</p>
          <div className="mt-6 space-y-4">
            <Select label="Type principal d'élevage" value={form.species} onChange={(v) => update("species", v)} options={["Bovin", "Ovin", "Caprin", "Porcin", "Mixte"]} />
            <Input label="Nombre moyen de têtes par an" type="number" value={form.headCount} onChange={(v) => update("headCount", v)} />
            <Input label="Valeur moyenne par tête en FCFA" type="number" value={form.valuePerHead} onChange={(v) => update("valuePerHead", v)} />
            <Input label="Nombre de pertes par vol par an" type="number" value={form.theftLosses} onChange={(v) => update("theftLosses", v)} />
            <Input label="Nombre de pertes par maladie par an" type="number" value={form.diseaseLosses} onChange={(v) => update("diseaseLosses", v)} />
            <Select label="Animaux déjà identifiés ?" value={form.alreadyIdentified} onChange={(v) => update("alreadyIdentified", v)} options={["Oui", "Non", "Partiellement"]} />
          </div>
        </div>

        <div className="rounded-[2rem] bg-vet-ink p-5 text-white sm:p-6">
          <div className="text-6xl">{form.species === "Bovin" ? "🐄" : form.species === "Ovin" ? "🐑" : form.species === "Caprin" ? "🐐" : form.species === "Porcin" ? "🐖" : "🐄🐑"}</div>
          <h3 className="mt-4 text-2xl font-black">Votre diagnostic économique</h3>
          <div className="mt-5 grid gap-3">
            <Metric label="Valeur estimée du cheptel" value={formatCurrency(calc.herdValue)} />
            <Metric label="Pertes par vol / an" value={formatCurrency(calc.theftValue)} />
            <Metric label="Pertes par maladie / an" value={formatCurrency(calc.diseaseValue)} />
            <Metric label="Pertes totales / an" value={formatCurrency(calc.annualLosses)} highlight />
            <Metric label="Pertes estimées sur 3 ans" value={formatCurrency(calc.losses3Years)} />
            <Metric label="Coût identification Vet'Tronic" value={formatCurrency(calc.identificationCost)} highlight />
          </div>
          <div className="mt-5 rounded-2xl bg-white/10 p-4">
            <p className="font-black">Simulation de réduction des pertes</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
              <div className="rounded-xl bg-white/10 p-3"><b>30%</b><br />{formatCurrency(calc.saving30)}</div>
              <div className="rounded-xl bg-white/10 p-3"><b>50%</b><br />{formatCurrency(calc.saving50)}</div>
              <div className="rounded-xl bg-white/10 p-3"><b>70%</b><br />{formatCurrency(calc.saving70)}</div>
            </div>
          </div>
          <button onClick={finish} className="mt-5 min-h-14 w-full rounded-2xl bg-vet-sun px-6 py-4 text-lg font-black text-vet-ink shadow-lg">
            Valider mon diagnostic 🏆
          </button>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value, highlight }) {
  return (
    <div className={`flex items-center justify-between gap-3 rounded-2xl p-4 ${highlight ? "bg-white text-vet-ink" : "bg-white/10"}`}>
      <span className="text-sm font-black">{label}</span>
      <span className="text-right text-lg font-black">{value}</span>
    </div>
  );
}

function Result({ record, onRestart }) {
  if (!record) return null;
  return (
    <section className="mx-auto max-w-3xl rounded-[2rem] bg-white p-5 text-center shadow-soft ring-1 ring-vet-green/20 sm:p-7">
      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-vet-sun text-5xl">🏆</div>
      <p className="mt-6 text-sm font-black uppercase tracking-widest text-vet-teal">Résultat enregistré</p>
      <h2 className="mt-2 text-4xl font-black">{record.resultLabel}</h2>
      <p className="mt-3 text-2xl font-black text-vet-teal">Score : {record.score}%</p>
      <p className="mt-5 rounded-2xl bg-slate-50 p-5 text-left text-slate-700">{record.summary}</p>
      <div className="mt-6 rounded-2xl bg-vet-green/15 p-5 text-left">
        <p className="font-black">Message Vet'Tronic</p>
        <p className="mt-2 text-slate-700">
          L'identification RFID Vet'Tronic donne à chaque animal une identité officielle, rattachée au propriétaire, à l'élevage et au suivi sanitaire national.
        </p>
      </div>
      <button onClick={onRestart} className="mt-8 min-h-14 w-full rounded-2xl bg-vet-teal px-6 py-4 text-lg font-black text-white shadow-lg hover:bg-vet-ink">
        Nouvelle participation →
      </button>
    </section>
  );
}

function labelForScore(score) {
  if (score >= 90) return "Expert Traçabilité Vet'Tronic";
  if (score >= 70) return "Ambassadeur de l'identification";
  if (score >= 40) return "Ami des animaux";
  return "Découverte";
}

function AdminPanel() {
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [rows, setRows] = useState(readParticipants());
  const [hasExported, setHasExported] = useState(false);

  function unlock() {
    if (pin === ADMIN_PIN) {
      setRows(readParticipants());
      setUnlocked(true);
    } else {
      alert("Code incorrect.");
    }
  }

  function exportRows() {
    if (!rows.length) {
      alert("Aucune participation à exporter.");
      return;
    }
    downloadCSV(rows);
    setHasExported(true);
  }

  function clearData() {
    if (rows.length && !hasExported) {
      alert("Exportez les données CSV avant de supprimer les participations.");
      return;
    }
    const ok = confirm("Supprimer toutes les participations stockées sur cette tablette ?");
    if (ok) {
      localStorage.removeItem(STORAGE_KEY);
      setRows([]);
      setHasExported(false);
    }
  }

  if (!unlocked) {
    return (
      <section className="mx-auto max-w-md rounded-[2rem] bg-white p-5 shadow-soft ring-1 ring-vet-green/20 sm:p-7">
        <h2 className="text-3xl font-black">Espace administrateur</h2>
        <p className="mt-2 text-slate-600">Accès réservé à l'équipe Vet'Tronic.</p>
        <div className="mt-5">
          <Input label="Code admin" value={pin} onChange={setPin} />
        </div>
        <button onClick={unlock} className="mt-5 min-h-14 w-full rounded-2xl bg-vet-ink px-6 py-4 font-black text-white">
          Entrer
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] bg-white p-5 shadow-soft ring-1 ring-vet-green/20 sm:p-7">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-black">Participations enregistrées</h2>
          <p className="mt-1 text-slate-600">Données stockées localement sur cette tablette uniquement.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setRows(readParticipants())} className="min-h-11 rounded-xl border border-slate-200 px-4 py-2 font-black">
            Rafraîchir
          </button>
          <button onClick={exportRows} className="min-h-11 rounded-xl bg-vet-teal px-4 py-2 font-black text-white">
            Exporter CSV
          </button>
          <button onClick={clearData} className="min-h-11 rounded-xl bg-vet-coral px-4 py-2 font-black text-white">
            Supprimer après export
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Stat label="Total" value={rows.length} />
        <Stat label="Éleveurs bétail" value={rows.filter((r) => r.profileId === "livestock-owner").length} />
        <Stat label="Favorables" value={rows.filter((r) => r.contact?.favorable === "Oui").length} />
        <Stat label="À recontacter" value={rows.filter((r) => r.contact?.contactConsent).length} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Nom</th>
              <th className="p-3">Téléphone</th>
              <th className="p-3">Profil</th>
              <th className="p-3">Animaux</th>
              <th className="p-3">Score</th>
              <th className="p-3">Résumé</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="p-3">{new Date(r.createdAt).toLocaleString("fr-FR")}</td>
                <td className="p-3 font-black">{r.contact?.firstName} {r.contact?.lastName}</td>
                <td className="p-3">{r.contact?.phone}</td>
                <td className="p-3">{r.profileTitle}</td>
                <td className="p-3">{r.contact?.animalTypes?.join(", ")}</td>
                <td className="p-3 font-black text-vet-teal">{r.score}%</td>
                <td className="max-w-md p-3 text-slate-600">{r.summary}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan="7" className="p-6 text-center text-slate-500">
                  Aucune participation enregistrée sur cette tablette.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
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

export default App;
