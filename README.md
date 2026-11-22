# bored. Paris Edition – Plateforme Anti-Ennui & Carte Interactive Leaflet

Bienvenue sur **bored. Paris Edition** !
Application web Next.js inspirée du style et de l'univers de **bored.com**, intégrant une **carte interactive Leaflet** pour épingler les activités et lieux parisiens en open data.

---

## 🌟 Nouvelles Fonctionnalités

### 🗺️ Carte Interactive Leaflet
- **Épinglage dynamique** de tous les points et activités avec coordonnées GPS (Fontaines, Parcs, Espaces verts, Équipements sportifs, Musées...).
- **Pins néon personnalisés (SVG DivIcons)** avec code couleur par catégorie (Cyan = Fontaines, Vert = Parcs, Jaune = Sports/Loisirs, Violet = Musées/Culture, Rouge = Autres).
- **Popups interactives style Bored.com** : nom, catégorie, statut gratuit/payant, adresse, horaires d'ouverture, distance GPS et liens directs vers l'itinéraire Google Maps.
- **Support de la géolocalisation** avec marqueur radar animé (*"Vous êtes ici"*).
- **Contrôles de carte** : recentrage automatique sur les points filtrés, centrage sur la position utilisateur, et bascule de style de carte (Mode sombre CartoDB Dark Matter / Mode clair).
- **Navigation synchronisée** : cliquer sur *"📍 Carte"* dans le tableau ou tirer un lieu au sort centre automatiquement la carte et ouvre la popup correspondante.

### 🎨 Design & CSS style Bored.com
- **Palette Dark Arcade** : fonds sombres profonds (`#0c0e17`), cartes à bordures néon rétro, accents vibrants (Rouge/Corail `#ff3366`, Cyan électrique `#00f0ff`, Jaune arcade `#ffe600`).
- **En-tête de marque** avec logo `bored.` et l'œil endormi interactif `(-.-)`.
- **Sélecteur de vue** : bascule en 1 clic entre la vue **Carte**, la vue **Tableau**, ou la vue **Mixte (Split)**.
- **Bouton Surprise Me / 🎲 Aléatoire** : tire un lieu au hasard parmi les résultats filtrés pour tuer l'ennui instantanément !
- **Filtres améliorés** : pills à bascule personnalisées (Gratuit uniquement, Ouvert), menus déroulants thématiques, bouton radar GPS.
- **Mascotte flottante Bored** : widget animé en bas à gauche avec l'œil endormi `(-.-)` qui réagit et propose des spots au clic.

---

## 🚀 Lancement du projet

```bash
cd quantic
npm install
npm run dev
```

Accédez ensuite à l'application sur [http://localhost:3000](http://localhost:3000).
