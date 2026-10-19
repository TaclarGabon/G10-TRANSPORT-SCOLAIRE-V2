# Incident urgent : doublons de dépenses carburant

## Rapport de Martina (19 octobre 2026)
- À l'appui sur « Enregistrer », aucune confirmation ne s'affiche.
- Elle réessaie plusieurs fois, se déconnecte, puis retrouve **une facture par clic**.
- Incident signalé comme récurrent.

**Ce qui est attesté :** plusieurs factures visibles après reconnexion. **Ce qui n'est pas encore prouvé :** latence réseau, écriture Firebase asynchrone, handler doublé, problème de rafraîchissement, ou plusieurs causes.

## Première étape — localisation
Le fichier V2 `index.html` contient ~8,9 Mo. L'outil GitHub de lecture à distance ne retourne pas le corps de ce fichier ; le script `node scripts/audit-expense-save.cjs` est destiné à une copie de travail Codex/locale et n'affiche que les lignes de marqueurs utiles. Examiner les handlers, l'appel `save()`, les appels Firebase et le modèle `vehicleExpenses`.

## Critères de correction à tester
1. Une seule action en cours : bouton désactivé dès le premier clic, état « Enregistrement en cours… ».
2. Une clé **stable par opération métier**, réutilisée lors d'une reprise/reconnexion. Une double requête ne doit pas créer deux lignes même si la première réponse est perdue. Un simple `disabled` local ne suffit pas.
3. Accusé « Enregistré » **uniquement après confirmation de persistance serveur**. Si `save()` ne renvoie pas de promesse, vérifier le mécanisme réel avant d'afficher un succès.
4. Sur échec, afficher l'erreur et proposer de vérifier si l'opération a été créée avant de la relancer. Ne jamais inviter à recliquer à l'aveugle.
5. Ne pas réutiliser la même clé pour **deux dépenses distinctes** ; conserver justificatifs, montants, date, auteur, et fonctionnement hors connexion si présent.
6. Prévoir une **liste de doublons suspects en lecture seule** avec références/horodatages, puis confirmation humaine pour chaque éventuelle correction. Aucune suppression ou fusion automatique.
7. Vérifier l'effet sur les totaux des rapports, les dépenses du chauffeur et les autres formulaires.
8. Scénarios : double clic, latence 30 secondes, échec avant/après commit, rechargement, deux onglets, reconnexion, iPhone.

## Garde-fous
- Aucune écriture ni suppression de données réelles pendant l'analyse.
- Aucune fusion, publication Pages ou changement des règles Firebase sans validation.
- Le script d'audit n'est **pas** une correction du bug : la correction dépend de l'inspection des fonctions réelles.
- Aucun nom d'enfant, facture réelle, image ni donnée personnelle sur GitHub public.
