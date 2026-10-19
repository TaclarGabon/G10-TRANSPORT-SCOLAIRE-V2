# Urgences Martina — 19 octobre 2026

## Messages reçus
1. « Est-ce possible d'avoir un fichier PDF pour tous les badges ? »
2. Le bouton **Enregistrer** d'une facture de carburant semble inactif ; plusieurs clics ne donnent aucun retour.
3. Après déconnexion/reconnexion, **autant de factures que de clics** apparaissent ; incident récurrent.

## État réel de la préparation
Branche de préproduction séparée ; **aucun changement de l'application V2 en service**.

### Badges PDF
- `g10-badges-pdf-v161.js` ajoute un bouton « Télécharger tous les badges (PDF) » dans l'espace Administration.
- Lit `window.st.subs` de la session V2, uniquement après connexion Firebase et vérification du rôle admin/direction.
- Reprend **exactement** l'URL QR du module `g10-qr-school-v146.js` : `qr-test.html?code=<qrRef>&v=4`.
- Génère le PDF localement dans le navigateur (jsPDF, QRCode), 4 badges par page A4.
- N'attribue jamais de QR manquant, n'appelle jamais `ensureG10QrRefs()` (qui écrit en V2), ne sauvegarde aucune donnée.
- Refuse les QR en double ; demande confirmation pour exclure les fiches sans QR valide.
- À tester : typographie, longueur des noms, accès aux bibliothèques CDN, authentification, rendu et scans imprimés. **Aucun PDF contenant les données réelles n'a encore été produit**.

### Enregistrement de dépenses
- `g10-expense-guard-v161.js` prépare un verrou d'interface de 90 secondes après un clic identifié dans le formulaire de dépenses ; affiche un message explicite et bloque les clics suivants.
- **Important : ce garde-fou n'est PAS une correction garantie du bug de sauvegarde.** Le code principal `index.html` fait près de 9 Mo ; son contenu intégral n'a pas pu être inspecté par le connecteur GitHub. L'origine de l'absence de confirmation et la logique exacte des écritures ne sont pas établies.
- Il faut identifier le gestionnaire de clic de production, les `save()`, la persistance Firebase, les erreurs réseau, les effets de reconnexion et les éventuels retries.
- Pour garantir l'unicité malgré des reconnexions, le bon correctif doit utiliser **un identifiant stable par facture / idempotency key** et une écriture atomique ou une transaction adaptée, et confirmer uniquement après retour du serveur.
- Ne jamais supprimer les doublons existants automatiquement. Faire un inventaire privé (date, bus, facture, montant, statut, justificatif) et demander validation avant correction comptable.

### Route de test
`v161-martina-preproduction.html` ouvre la V2 via son wrapper v1471 puis charge ces scripts dans l'iframe interne. **Non publié sur Pages** ; ne pas utiliser pour saisir des dépenses réelles avant revue.

## Avant toute mise en production
1. Exécuter `node --test tests/martina-badges-v161.test.cjs` et `node --check` sur les scripts.
2. Faire une revue du chemin exact de production de Martina : la version v1471 peut différer de son lien actuel.
3. Tester la génération PDF sur un compte autorisé et vérifier 2–3 badges en scan réel.
4. Examiner les appels d'enregistrement réels de factures, corriger côté persistance, puis tester : un clic, 3 clics rapides, connexion lente, reconnexion, erreur réseau, sauvegarde après timeout.
5. Préparer un plan de rollback. Ne pas fusionner/déployer sans autorisation expresse.

## Consigne opérationnelle immédiate à transmettre à Martina
En attendant le correctif : **ne cliquer qu'une fois** sur Enregistrer. Si rien ne se passe, consulter la liste des dépenses ou se reconnecter pour vérifier si la facture existe déjà avant toute nouvelle tentative. Ne pas enregistrer plusieurs fois la même facture. Signaler les doublons sans les supprimer.
