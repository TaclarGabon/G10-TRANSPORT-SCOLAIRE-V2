# G10 V1.61 — Préproduction Owendo (non publiée)

Branche de travail isolée de `main`. Ne pas remplacer le site actuel avant validation.

## Contrôles déjà effectués
- Firebase : authentification anonyme, écriture, relecture et suppression d'un marqueur technique confirmées.
- Un dossier fictif dans `g10TransportScolaireV2/axes/owendo/_integrationTests/abonnes` a été relu sur un deuxième appareil.
- L'export de `demoState` a été conservé hors ligne avant travaux.
- Aucun test n'a validé l'enregistrement d'un vrai abonné dans le formulaire opérationnel.

## Bloquants de mise en production
1. Les règles actuelles `.read/.write = auth != null` permettent à tout compte anonyme authentifié de lire et modifier toutes les données, y compris celles des familles et des paiements. Remplacer par une gestion d'accès réellement vérifiable côté serveur avant de saisir des enfants réels.
2. L'ancien code utilise une sauvegarde globale de `demoState/state` ; éviter les réécritures concurrentes et les migrations automatiques non vérifiées.
3. La V1.61 pilote comporte des formulaires Owendo distincts qui n'ont pas la parité fonctionnelle complète avec Akanda (reçus, vraies pièces justificatives, événements QR et profils).
4. Préserver les registres uniques `drivers` et `staff`. Les affectations sont reliées au bus, pas à un chauffeur figé.
5. Les écritures financières historiques sans axe ne doivent pas être redistribuées arbitrairement.
6. Tester les rapports consolidés et les filtres Akanda / Inter-Akanda / Owendo : les totaux globaux doivent correspondre aux sommes des écritures sans double comptabilisation.
7. Refaire un export Firebase immédiatement avant bascule; comparer comptes, montants, dépenses et identifiants avant / après.
8. Tester avec deux appareils et plusieurs sessions distinctes, et non seulement avec une lecture de dossier fictif.

## Critères d'acceptation
- Administration Owendo : 11 onglets, ajout d'un enfant, emplois du temps, ordres d'arrêts et d'établissements.
- Le chauffeur affecté au BUS-3 voit uniquement les missions autorisées du BUS-3.
- Les panneaux Staff/Chauffeurs partagent un registre unique; les autres données sont filtrées par axe.
- QR indisponible avant confirmation du paiement et du dossier.
- Paiements et dépenses reliés aux identifiants du dossier et du bus, avec audit.
- Gestion et Direction : vue globale et par axe, montants concordants.
- Règles Firebase : accès contrôlés par rôle et compte, test de refus d'accès croisé.
- Comparaison et relecture Firebase réussies sans écraser les écritures réelles.
