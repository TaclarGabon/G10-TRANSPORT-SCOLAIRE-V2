# Urgence Martina — dépenses carburant et badges PDF (19 octobre 2026)

## Diagnostic confirmé dans la V2 publiée
La version V2 actuelle contient **plusieurs versions successives** de `addExpense`, et la fonction active V1.45 `addExpenseV145(ctx,validateNow)` ajoute une dépense dans `st.vehicleExpenses` après un `compressReceipt(file,callback)` asynchrone. Les boutons « Enregistrer à vérifier » et « Enregistrer & valider » peuvent être cliqués plusieurs fois pendant la compression, ce qui peut créer autant de lignes. `save()` écrit en local puis planifie `demoRef.set(...)` vers Firebase avec temporisation : le clic n'attend pas un accusé de réception.

## Correctif technique en préparation
- `correctifs/g10-expense-guard-v1.js` : module **non chargé par l'application**, destiné à être installé après la définition de `addExpenseV145`, et seulement après tests.
- Verrouillage immédiat par contexte admin/gestion/chauffeur, message « traitement en cours », détection de nouvelle entrée dans l'état local, lecture Firebase de vérification de l'identifiant après écriture (aucune écriture supplémentaire), avertissement pour une facture identique dans les 30 minutes, sans suppression ni modification automatique.
- Le module est un **garde UI complémentaire**. Il ne garantit pas l'unicité sur deux navigateurs ni le bon fonctionnement de la synchronisation globale V2 (écriture de l'état complet). Un correctif définitif devrait donner une identité stable à l'opération et une sauvegarde atomique côté Firebase.
- `tests/g10-expense-guard.test.cjs` : scénarios synthétiques de triple clic et de détection de doublon, à exécuter par CI.
- Le module n'est **pas intégré** au fichier `index.html` : ce fichier de près de 9 Mo ne doit pas être réécrit aveuglément, et les modifications directes ont échoué pour des raisons de transport. Il faut valider une stratégie d'inclusion et des tests authentifiés avant intégration.

## PDF groupé déjà disponible dans le code V2
La fonction `printAllBadgesV146()` est déjà présente dans `index.html`. Elle est appelée par le bouton « Imprimer tous les QR / badges » du panneau `qrAdminPanelV146()`, affiché notamment dans **Administration → Abonnés**. Elle génère une planche A4 avec **9 badges par page** au format 54 × 85 mm, et ouvre l'impression du navigateur.

**Instructions pour Martina :**
1. Ouvrir l'application V2 habituelle, Administration → Abonnés → Badges / QR élèves.
2. Cliquer sur « Imprimer tous les QR / badges ».
3. Dans la fenêtre d'impression, choisir « Enregistrer au format PDF » ou « Save as PDF ».
4. Vérifier le nombre de badges/pages, les noms, photos et QR avant de partager le PDF via un canal privé.

**Attention :** seuls les abonnements actifs/confirmés sont sélectionnés par le code. `ensureQRRefsV146()` peut générer des références dans l'état local ; ne pas réimprimer des QR non vérifiés en production sans contrôler leur persistance. L'impression des images QR utilise une URL de génération distante dans la V2 existante : vérifier le rendu avant l'envoi.

## Protocole d'urgence avant correction
- Martina : **un seul clic** sur Enregistrer, attendre la compression photo et le statut Firebase ; si rien ne change, vérifier l'historique avant de recommencer. Ne pas supprimer les entrées suspectes.
- Direction : vérifier en lecture seule les entrées récentes `vehicleExpenses`, rapprocher date, montant, litres, kilométrage, station, justificatif et personne ayant saisi. Distinguer doublons réels de dépenses distinctes.
- Toute annulation doit suivre une sauvegarde privée et une validation humaine. Aucun effacement automatique.

## À valider avant production
- Tests Node et navigateur (photo lente, triple clic, erreur réseau, reconnexion, saisie depuis deux appareils).
- Vérifier si l'app utilisée par Martina est `index.html`, `v1471.html` ou une autre URL, afin de brancher le module au bon point d'entrée.
- Intégrer dans une branche séparée et tester, puis **demander l'accord explicite** avant fusion/déploiement.
- Contrôler que les PDF QR correspondent aux enfants réellement autorisés.
