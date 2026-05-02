# VET'TRONIC SELAB Challenge

Application React/Vite en JavaScript, avec Tailwind CSS.

## Fonctionnement

- Aucun serveur applicatif.
- Aucune base de données distante.
- Les participations sont stockées dans `localStorage` sur chaque tablette.
- L'espace administrateur permet de consulter les participations, d'exporter un CSV et de supprimer les données après export.
- Le prix d'identification est fixé à `15 000 FCFA` par animal dans `src/App.jsx`.

## Installation

```bash
npm install
npm run dev
```

## Build statique

```bash
npm run build
npm run preview
```

Le dossier `dist` produit par Vite peut être copié sur une machine ou hébergé comme site statique. La configuration utilise `base: "./"` pour faciliter un déploiement statique simple.

## Déploiement Vercel

Paramètres du projet :

- Framework preset : `Vite`
- Install command : `npm install`
- Build command : `npm run build`
- Output directory : `dist`
- Base path Vite : `./`

Ces paramètres sont aussi déclarés dans `vercel.json`.

## Administration

Code admin par défaut : `2026`.

Les données restent uniquement sur la tablette utilisée. Il faut exporter le CSV depuis chaque tablette avant de supprimer ses données locales.
