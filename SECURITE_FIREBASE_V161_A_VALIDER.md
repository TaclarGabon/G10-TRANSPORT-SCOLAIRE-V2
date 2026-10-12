# Règles V1.61 — proposition NON APPLIQUÉE

Les règles actuellement publiées permettent à tout utilisateur authentifié, y compris anonyme, de lire et modifier toute la base. Cette proposition est un **exemple de politique restrictive** à adapter et tester ; elle ne doit **PAS** être collée telle quelle dans la console : les propriétés de contrôle de rôle présentées dans le brouillon doivent être remplacées par des expressions RTDB valides, et les comptes doivent recevoir des rôles vérifiés côté serveur.

Étapes nécessaires :
1. Définir l'identité durable du personnel (comptes Firebase Authentication non anonymes).
2. Attribuer les rôles par un service d'administration sécurisé (custom claims ou registre protégé) ; aucun rôle ne doit être attribuable par le client.
3. Accorder à Administration uniquement les écritures appropriées ; restreindre paiements/reçus et journal d'audit séparément.
4. Restreindre les enfants et parents à leurs seuls dossiers et les chauffeurs à leurs missions autorisées.
5. Vérifier les refus dans l'émulateur Firebase : anonyme, parent A, parent B, chauffeur non affecté, administration, Direction.
6. Ne changer les règles de la production qu'après migration et contrôle des anciennes fonctions.

NE PAS APPLIQUER le brouillon en production. Les règles actuelles restent inchangées.
