// backend/models/national/NationalSettings.js

// On importe mongoose pour définir le schéma et le modèle MongoDB.
const mongoose = require('mongoose');

// On crée un sous-schéma réutilisable pour la partie structure.
// _id: false évite de générer un ObjectId inutile pour chaque sous-objet.
const structureSchema = new mongoose.Schema(
  {
    // Active ou non la gestion des provinces.
    provincesEnabled: {
      type: Boolean,
      default: false,
    },

    // Active ou non la gestion des cellules.
    cellulesEnabled: {
      type: Boolean,
      default: false,
    },

    // Active ou non la gestion des départements.
    departementsEnabled: {
      type: Boolean,
      default: false,
    },

    // Active ou non la gestion des membres.
    membersEnabled: {
      type: Boolean,
      default: false,
    },

    // Active ou non la gestion des adhésions.
    adhesionsEnabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  }
);

// Sous-schéma pour les modules métiers.
const modulesSchema = new mongoose.Schema(
  {
    // Module ressources humaines.
    rh: {
      type: Boolean,
      default: false,
    },

    // Module finances.
    finances: {
      type: Boolean,
      default: false,
    },

    // Module formations.
    formations: {
      type: Boolean,
      default: false,
    },

    // Module membres.
    membres: {
      type: Boolean,
      default: false,
    },

    // Module adhésions.
    adhesions: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  }
);

// Sous-schéma pour les règles de gouvernance.
const governanceSchema = new mongoose.Schema(
  {
    // Oblige la validation avant activation d’une adhésion.
    requireValidationForAdhesion: {
      type: Boolean,
      default: false,
    },

    // Verrouille certaines opérations financières sans approbation.
    lockFinanceActionsWithoutApproval: {
      type: Boolean,
      default: false,
    },

    // Autorise la création de provinces au niveau national.
    allowProvinceCreation: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  }
);

// Sous-schéma pour contrôler l’activation des routes côté frontend.
const routesSchema = new mongoose.Schema(
  {
    // Autorise l’accès à la gestion des provinces.
    provincesRouteEnabled: {
      type: Boolean,
      default: false,
    },

    // Autorise l’accès à la page settings.
    settingsRouteEnabled: {
      type: Boolean,
      default: true,
    },

    // Autorise l’accès à la page membres.
    membresRouteEnabled: {
      type: Boolean,
      default: false,
    },

    // Autorise l’accès à la page adhésions.
    adhesionsRouteEnabled: {
      type: Boolean,
      default: false,
    },

    // Autorise l’accès à la page départements.
    departementsRouteEnabled: {
      type: Boolean,
      default: false,
    },

    // Autorise l’accès à la page cellules.
    cellulesRouteEnabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  }
);

// Schéma principal des settings nationaux.
const nationalSettingsSchema = new mongoose.Schema(
  {
    // Champ servant à garantir qu’il n’existe qu’un seul document national.
    scope: {
      type: String,
      required: true,
      default: 'national',
      unique: true,
      trim: true,
      index: true,
    },

    // Bloc structurel de l’organisation.
    structure: {
      type: structureSchema,
      default: () => ({}),
    },

    // Bloc modules métiers.
    modules: {
      type: modulesSchema,
      default: () => ({}),
    },

    // Bloc gouvernance.
    governance: {
      type: governanceSchema,
      default: () => ({}),
    },

    // Bloc activation des routes.
    routes: {
      type: routesSchema,
      default: () => ({}),
    },
  },
  {
    // Ajoute createdAt et updatedAt automatiquement.
    timestamps: true,

    // Supprime __v pour garder des réponses plus propres.
    versionKey: false,
  }
);

// Option utile pour que les objets JSON soient plus propres si on les sérialise.
nationalSettingsSchema.set('toJSON', {
  transform: function transform(doc, ret) {
    // On garde _id si besoin futur, mais on peut aussi l’exposer tel quel.
    return ret;
  },
});

// On exporte le modèle Mongoose.
module.exports = mongoose.model('NationalSettings', nationalSettingsSchema);