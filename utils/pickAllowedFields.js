// backend/utils/pickAllowedFields.js

// Utilitaire qui ne garde que les clés explicitement autorisées.
function pickAllowedFields(source = {}, allowedKeys = []) {
  // Objet résultat vide.
  const result = {};

  // Si la source n’est pas un objet valide, on renvoie vide.
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return result;
  }

  // On parcourt les clés autorisées.
  for (const key of allowedKeys) {
    // Si la clé existe bien dans la source, on la copie.
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      result[key] = source[key];
    }
  }

  // On renvoie l’objet nettoyé.
  return result;
}

// Export.
module.exports = pickAllowedFields;