const translateInstruction = (text) => {
    if (!text || typeof text !== 'string') {
      console.warn('Texte d\'instruction invalide:', text);
      return 'Continuer';
    }
  
    let cleanedText = text
      .replace(/Csurtdansuezz?r/gi, 'Continuer')
      .replace(/Csurt[ -]?dansuezz?/gi, 'Continuer')
      .replace(/[^\x20-\x7E\sàéèêëîïôöùûüçÀÉÈÊËÎÏÔÖÙÛÜÇ,]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  
    const instructionTranslations = {
      'Continue straight': 'Continuer tout droit',
      'Turn right': 'Tourner à droite',
      'Turn left': 'Tourner à gauche',
      'Arrive': 'Arrivée',
      'Départ': 'Départ',
    };
  
    const roadTypeTranslations = {
      'residential': 'Route résidentielle',
      'motorway': 'Autoroute',
      'trunk': 'Route principale',
      'primary': 'Route primaire',
      'secondary': 'Route secondaire',
      'tertiary': 'Route tertiaire',
    };
  
    let translated = cleanedText;
  
    Object.keys(instructionTranslations).forEach((key) => {
      const regex = new RegExp(`\\b${key}\\b`, 'gi');
      translated = translated.replace(regex, instructionTranslations[key]);
    });
  
    Object.keys(roadTypeTranslations).forEach((key) => {
      const regex = new RegExp(`\\bsur ${key}\\b`, 'gi');
      translated = translated.replace(regex, `sur ${roadTypeTranslations[key]}`);
    });
  
    return translated;
  };
  
  export default translateInstruction;
