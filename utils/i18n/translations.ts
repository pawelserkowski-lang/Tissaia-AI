/**
 * Translation files for supported languages
 */

export type TranslationKey = keyof typeof en;

/**
 * English translations (default)
 */
export const en = {
  // Common
  'common.appName': 'Tissaia AI',
  'common.loading': 'Loading...',
  'common.error': 'Error',
  'common.success': 'Success',
  'common.cancel': 'Cancel',
  'common.confirm': 'Confirm',
  'common.save': 'Save',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.close': 'Close',
  'common.back': 'Back',
  'common.next': 'Next',
  'common.previous': 'Previous',
  'common.submit': 'Submit',
  'common.reset': 'Reset',
  'common.clear': 'Clear',
  'common.search': 'Search',
  'common.filter': 'Filter',
  'common.sort': 'Sort',

  // Navigation
  'nav.home': 'Home',
  'nav.upload': 'Upload',
  'nav.gallery': 'Gallery',
  'nav.settings': 'Settings',
  'nav.help': 'Help',
  'nav.about': 'About',

  // Upload
  'upload.title': 'Upload Images',
  'upload.dragDrop': 'Drag and drop images here',
  'upload.or': 'or',
  'upload.browse': 'Browse files',
  'upload.processing': 'Processing...',
  'upload.success': 'Images uploaded successfully',
  'upload.error': 'Failed to upload images',
  'upload.maxSize': 'Maximum file size: {size}MB',
  'upload.allowedTypes': 'Allowed types: {types}',

  // Analysis
  'analysis.title': 'Image Analysis',
  'analysis.detecting': 'Detecting text in image...',
  'analysis.found': 'Found {count} text regions',
  'analysis.noText': 'No text detected in image',
  'analysis.error': 'Analysis failed',
  'analysis.retry': 'Retry',

  // Restoration
  'restoration.title': 'Image Restoration',
  'restoration.processing': 'Restoring image...',
  'restoration.success': 'Image restored successfully',
  'restoration.error': 'Restoration failed',
  'restoration.download': 'Download result',

  // Gallery
  'gallery.title': 'Image Gallery',
  'gallery.empty': 'No images yet',
  'gallery.upload': 'Upload your first image',
  'gallery.deleteConfirm': 'Are you sure you want to delete this image?',
  'gallery.selectAll': 'Select all',
  'gallery.deselectAll': 'Deselect all',
  'gallery.selected': '{count} selected',

  // Settings
  'settings.title': 'Settings',
  'settings.language': 'Language',
  'settings.theme': 'Theme',
  'settings.notifications': 'Notifications',
  'settings.autoSave': 'Auto-save',
  'settings.quality': 'Quality',
  'settings.cache': 'Cache',
  'settings.clearCache': 'Clear cache',
  'settings.cacheCleared': 'Cache cleared successfully',

  // Themes
  'theme.dark': 'Dark',
  'theme.light': 'Light',
  'theme.cyberpunk': 'Cyberpunk',
  'theme.classic': 'Classic',
  'theme.highContrast': 'High Contrast',

  // Errors
  'error.network': 'Network error. Please check your connection.',
  'error.server': 'Server error. Please try again later.',
  'error.invalidFile': 'Invalid file format',
  'error.fileTooLarge': 'File is too large',
  'error.unknown': 'An unknown error occurred',

  // Keyboard shortcuts
  'shortcuts.title': 'Keyboard Shortcuts',
  'shortcuts.upload': 'Upload image',
  'shortcuts.analyze': 'Analyze image',
  'shortcuts.restore': 'Restore image',
  'shortcuts.save': 'Save',
  'shortcuts.help': 'Show help',
  'shortcuts.close': 'Close dialog',

  // Batch processing
  'batch.title': 'Batch Processing',
  'batch.queue': 'Queue',
  'batch.processing': 'Processing {current} of {total}',
  'batch.completed': 'Completed',
  'batch.failed': 'Failed',
  'batch.pause': 'Pause',
  'batch.resume': 'Resume',
  'batch.cancel': 'Cancel all',
  'batch.clear': 'Clear completed',
  'batch.retry': 'Retry failed',

  // Performance
  'performance.title': 'Performance',
  'performance.webVitals': 'Web Vitals',
  'performance.lcp': 'Largest Contentful Paint',
  'performance.fid': 'First Input Delay',
  'performance.cls': 'Cumulative Layout Shift',
  'performance.good': 'Good',
  'performance.needsImprovement': 'Needs improvement',
  'performance.poor': 'Poor',
} as const;

/**
 * Spanish translations
 */
export const es: Record<TranslationKey, string> = {
  // Common
  'common.appName': 'Tissaia IA',
  'common.loading': 'Cargando...',
  'common.error': 'Error',
  'common.success': 'Éxito',
  'common.cancel': 'Cancelar',
  'common.confirm': 'Confirmar',
  'common.save': 'Guardar',
  'common.delete': 'Eliminar',
  'common.edit': 'Editar',
  'common.close': 'Cerrar',
  'common.back': 'Atrás',
  'common.next': 'Siguiente',
  'common.previous': 'Anterior',
  'common.submit': 'Enviar',
  'common.reset': 'Restablecer',
  'common.clear': 'Limpiar',
  'common.search': 'Buscar',
  'common.filter': 'Filtrar',
  'common.sort': 'Ordenar',

  // Navigation
  'nav.home': 'Inicio',
  'nav.upload': 'Subir',
  'nav.gallery': 'Galería',
  'nav.settings': 'Configuración',
  'nav.help': 'Ayuda',
  'nav.about': 'Acerca de',

  // Upload
  'upload.title': 'Subir imágenes',
  'upload.dragDrop': 'Arrastra y suelta imágenes aquí',
  'upload.or': 'o',
  'upload.browse': 'Buscar archivos',
  'upload.processing': 'Procesando...',
  'upload.success': 'Imágenes subidas exitosamente',
  'upload.error': 'Error al subir imágenes',
  'upload.maxSize': 'Tamaño máximo de archivo: {size}MB',
  'upload.allowedTypes': 'Tipos permitidos: {types}',

  // Analysis
  'analysis.title': 'Análisis de imagen',
  'analysis.detecting': 'Detectando texto en la imagen...',
  'analysis.found': 'Se encontraron {count} regiones de texto',
  'analysis.noText': 'No se detectó texto en la imagen',
  'analysis.error': 'Error en el análisis',
  'analysis.retry': 'Reintentar',

  // Restoration
  'restoration.title': 'Restauración de imagen',
  'restoration.processing': 'Restaurando imagen...',
  'restoration.success': 'Imagen restaurada exitosamente',
  'restoration.error': 'Error en la restauración',
  'restoration.download': 'Descargar resultado',

  // Gallery
  'gallery.title': 'Galería de imágenes',
  'gallery.empty': 'No hay imágenes todavía',
  'gallery.upload': 'Sube tu primera imagen',
  'gallery.deleteConfirm': '¿Estás seguro de que quieres eliminar esta imagen?',
  'gallery.selectAll': 'Seleccionar todo',
  'gallery.deselectAll': 'Deseleccionar todo',
  'gallery.selected': '{count} seleccionado(s)',

  // Settings
  'settings.title': 'Configuración',
  'settings.language': 'Idioma',
  'settings.theme': 'Tema',
  'settings.notifications': 'Notificaciones',
  'settings.autoSave': 'Guardado automático',
  'settings.quality': 'Calidad',
  'settings.cache': 'Caché',
  'settings.clearCache': 'Limpiar caché',
  'settings.cacheCleared': 'Caché limpiado exitosamente',

  // Themes
  'theme.dark': 'Oscuro',
  'theme.light': 'Claro',
  'theme.cyberpunk': 'Cyberpunk',
  'theme.classic': 'Clásico',
  'theme.highContrast': 'Alto contraste',

  // Errors
  'error.network': 'Error de red. Por favor verifica tu conexión.',
  'error.server': 'Error del servidor. Por favor intenta más tarde.',
  'error.invalidFile': 'Formato de archivo inválido',
  'error.fileTooLarge': 'El archivo es demasiado grande',
  'error.unknown': 'Ocurrió un error desconocido',

  // Keyboard shortcuts
  'shortcuts.title': 'Atajos de teclado',
  'shortcuts.upload': 'Subir imagen',
  'shortcuts.analyze': 'Analizar imagen',
  'shortcuts.restore': 'Restaurar imagen',
  'shortcuts.save': 'Guardar',
  'shortcuts.help': 'Mostrar ayuda',
  'shortcuts.close': 'Cerrar diálogo',

  // Batch processing
  'batch.title': 'Procesamiento por lotes',
  'batch.queue': 'Cola',
  'batch.processing': 'Procesando {current} de {total}',
  'batch.completed': 'Completado',
  'batch.failed': 'Fallido',
  'batch.pause': 'Pausar',
  'batch.resume': 'Reanudar',
  'batch.cancel': 'Cancelar todo',
  'batch.clear': 'Limpiar completados',
  'batch.retry': 'Reintentar fallidos',

  // Performance
  'performance.title': 'Rendimiento',
  'performance.webVitals': 'Web Vitals',
  'performance.lcp': 'Largest Contentful Paint',
  'performance.fid': 'First Input Delay',
  'performance.cls': 'Cumulative Layout Shift',
  'performance.good': 'Bueno',
  'performance.needsImprovement': 'Necesita mejorar',
  'performance.poor': 'Pobre',
};

/**
 * French translations
 */
export const fr: Record<TranslationKey, string> = {
  // Common
  'common.appName': 'Tissaia IA',
  'common.loading': 'Chargement...',
  'common.error': 'Erreur',
  'common.success': 'Succès',
  'common.cancel': 'Annuler',
  'common.confirm': 'Confirmer',
  'common.save': 'Enregistrer',
  'common.delete': 'Supprimer',
  'common.edit': 'Modifier',
  'common.close': 'Fermer',
  'common.back': 'Retour',
  'common.next': 'Suivant',
  'common.previous': 'Précédent',
  'common.submit': 'Soumettre',
  'common.reset': 'Réinitialiser',
  'common.clear': 'Effacer',
  'common.search': 'Rechercher',
  'common.filter': 'Filtrer',
  'common.sort': 'Trier',

  // Navigation
  'nav.home': 'Accueil',
  'nav.upload': 'Télécharger',
  'nav.gallery': 'Galerie',
  'nav.settings': 'Paramètres',
  'nav.help': 'Aide',
  'nav.about': 'À propos',

  // Upload
  'upload.title': 'Télécharger des images',
  'upload.dragDrop': 'Glissez-déposez des images ici',
  'upload.or': 'ou',
  'upload.browse': 'Parcourir les fichiers',
  'upload.processing': 'Traitement en cours...',
  'upload.success': 'Images téléchargées avec succès',
  'upload.error': 'Échec du téléchargement des images',
  'upload.maxSize': 'Taille maximale du fichier : {size}MB',
  'upload.allowedTypes': 'Types autorisés : {types}',

  // Analysis
  'analysis.title': 'Analyse d\'image',
  'analysis.detecting': 'Détection de texte dans l\'image...',
  'analysis.found': '{count} régions de texte trouvées',
  'analysis.noText': 'Aucun texte détecté dans l\'image',
  'analysis.error': 'Échec de l\'analyse',
  'analysis.retry': 'Réessayer',

  // Restoration
  'restoration.title': 'Restauration d\'image',
  'restoration.processing': 'Restauration de l\'image...',
  'restoration.success': 'Image restaurée avec succès',
  'restoration.error': 'Échec de la restauration',
  'restoration.download': 'Télécharger le résultat',

  // Gallery
  'gallery.title': 'Galerie d\'images',
  'gallery.empty': 'Pas encore d\'images',
  'gallery.upload': 'Téléchargez votre première image',
  'gallery.deleteConfirm': 'Êtes-vous sûr de vouloir supprimer cette image?',
  'gallery.selectAll': 'Tout sélectionner',
  'gallery.deselectAll': 'Tout désélectionner',
  'gallery.selected': '{count} sélectionné(s)',

  // Settings
  'settings.title': 'Paramètres',
  'settings.language': 'Langue',
  'settings.theme': 'Thème',
  'settings.notifications': 'Notifications',
  'settings.autoSave': 'Sauvegarde automatique',
  'settings.quality': 'Qualité',
  'settings.cache': 'Cache',
  'settings.clearCache': 'Vider le cache',
  'settings.cacheCleared': 'Cache vidé avec succès',

  // Themes
  'theme.dark': 'Sombre',
  'theme.light': 'Clair',
  'theme.cyberpunk': 'Cyberpunk',
  'theme.classic': 'Classique',
  'theme.highContrast': 'Contraste élevé',

  // Errors
  'error.network': 'Erreur réseau. Veuillez vérifier votre connexion.',
  'error.server': 'Erreur serveur. Veuillez réessayer plus tard.',
  'error.invalidFile': 'Format de fichier invalide',
  'error.fileTooLarge': 'Le fichier est trop volumineux',
  'error.unknown': 'Une erreur inconnue s\'est produite',

  // Keyboard shortcuts
  'shortcuts.title': 'Raccourcis clavier',
  'shortcuts.upload': 'Télécharger une image',
  'shortcuts.analyze': 'Analyser l\'image',
  'shortcuts.restore': 'Restaurer l\'image',
  'shortcuts.save': 'Enregistrer',
  'shortcuts.help': 'Afficher l\'aide',
  'shortcuts.close': 'Fermer la boîte de dialogue',

  // Batch processing
  'batch.title': 'Traitement par lots',
  'batch.queue': 'File d\'attente',
  'batch.processing': 'Traitement de {current} sur {total}',
  'batch.completed': 'Terminé',
  'batch.failed': 'Échoué',
  'batch.pause': 'Pause',
  'batch.resume': 'Reprendre',
  'batch.cancel': 'Tout annuler',
  'batch.clear': 'Effacer les terminés',
  'batch.retry': 'Réessayer les échecs',

  // Performance
  'performance.title': 'Performance',
  'performance.webVitals': 'Web Vitals',
  'performance.lcp': 'Largest Contentful Paint',
  'performance.fid': 'First Input Delay',
  'performance.cls': 'Cumulative Layout Shift',
  'performance.good': 'Bon',
  'performance.needsImprovement': 'À améliorer',
  'performance.poor': 'Faible',
};

/**
 * German translations
 */
export const de: Record<TranslationKey, string> = {
  // Common
  'common.appName': 'Tissaia KI',
  'common.loading': 'Laden...',
  'common.error': 'Fehler',
  'common.success': 'Erfolg',
  'common.cancel': 'Abbrechen',
  'common.confirm': 'Bestätigen',
  'common.save': 'Speichern',
  'common.delete': 'Löschen',
  'common.edit': 'Bearbeiten',
  'common.close': 'Schließen',
  'common.back': 'Zurück',
  'common.next': 'Weiter',
  'common.previous': 'Vorherige',
  'common.submit': 'Absenden',
  'common.reset': 'Zurücksetzen',
  'common.clear': 'Löschen',
  'common.search': 'Suchen',
  'common.filter': 'Filtern',
  'common.sort': 'Sortieren',

  // Navigation
  'nav.home': 'Startseite',
  'nav.upload': 'Hochladen',
  'nav.gallery': 'Galerie',
  'nav.settings': 'Einstellungen',
  'nav.help': 'Hilfe',
  'nav.about': 'Über',

  // Upload
  'upload.title': 'Bilder hochladen',
  'upload.dragDrop': 'Bilder hierher ziehen und ablegen',
  'upload.or': 'oder',
  'upload.browse': 'Dateien durchsuchen',
  'upload.processing': 'Verarbeitung...',
  'upload.success': 'Bilder erfolgreich hochgeladen',
  'upload.error': 'Hochladen fehlgeschlagen',
  'upload.maxSize': 'Maximale Dateigröße: {size}MB',
  'upload.allowedTypes': 'Erlaubte Typen: {types}',

  // Analysis
  'analysis.title': 'Bildanalyse',
  'analysis.detecting': 'Texterkennung im Bild...',
  'analysis.found': '{count} Textbereiche gefunden',
  'analysis.noText': 'Kein Text im Bild erkannt',
  'analysis.error': 'Analyse fehlgeschlagen',
  'analysis.retry': 'Wiederholen',

  // Restoration
  'restoration.title': 'Bildwiederherstellung',
  'restoration.processing': 'Bild wird wiederhergestellt...',
  'restoration.success': 'Bild erfolgreich wiederhergestellt',
  'restoration.error': 'Wiederherstellung fehlgeschlagen',
  'restoration.download': 'Ergebnis herunterladen',

  // Gallery
  'gallery.title': 'Bildergalerie',
  'gallery.empty': 'Noch keine Bilder',
  'gallery.upload': 'Laden Sie Ihr erstes Bild hoch',
  'gallery.deleteConfirm': 'Möchten Sie dieses Bild wirklich löschen?',
  'gallery.selectAll': 'Alle auswählen',
  'gallery.deselectAll': 'Alle abwählen',
  'gallery.selected': '{count} ausgewählt',

  // Settings
  'settings.title': 'Einstellungen',
  'settings.language': 'Sprache',
  'settings.theme': 'Design',
  'settings.notifications': 'Benachrichtigungen',
  'settings.autoSave': 'Automatisches Speichern',
  'settings.quality': 'Qualität',
  'settings.cache': 'Cache',
  'settings.clearCache': 'Cache leeren',
  'settings.cacheCleared': 'Cache erfolgreich geleert',

  // Themes
  'theme.dark': 'Dunkel',
  'theme.light': 'Hell',
  'theme.cyberpunk': 'Cyberpunk',
  'theme.classic': 'Klassisch',
  'theme.highContrast': 'Hoher Kontrast',

  // Errors
  'error.network': 'Netzwerkfehler. Bitte überprüfen Sie Ihre Verbindung.',
  'error.server': 'Serverfehler. Bitte versuchen Sie es später erneut.',
  'error.invalidFile': 'Ungültiges Dateiformat',
  'error.fileTooLarge': 'Datei ist zu groß',
  'error.unknown': 'Ein unbekannter Fehler ist aufgetreten',

  // Keyboard shortcuts
  'shortcuts.title': 'Tastenkombinationen',
  'shortcuts.upload': 'Bild hochladen',
  'shortcuts.analyze': 'Bild analysieren',
  'shortcuts.restore': 'Bild wiederherstellen',
  'shortcuts.save': 'Speichern',
  'shortcuts.help': 'Hilfe anzeigen',
  'shortcuts.close': 'Dialog schließen',

  // Batch processing
  'batch.title': 'Stapelverarbeitung',
  'batch.queue': 'Warteschlange',
  'batch.processing': 'Verarbeitung von {current} von {total}',
  'batch.completed': 'Abgeschlossen',
  'batch.failed': 'Fehlgeschlagen',
  'batch.pause': 'Pause',
  'batch.resume': 'Fortsetzen',
  'batch.cancel': 'Alle abbrechen',
  'batch.clear': 'Abgeschlossene löschen',
  'batch.retry': 'Fehlgeschlagene wiederholen',

  // Performance
  'performance.title': 'Leistung',
  'performance.webVitals': 'Web Vitals',
  'performance.lcp': 'Largest Contentful Paint',
  'performance.fid': 'First Input Delay',
  'performance.cls': 'Cumulative Layout Shift',
  'performance.good': 'Gut',
  'performance.needsImprovement': 'Verbesserungsbedarf',
  'performance.poor': 'Schlecht',
};

/**
 * All supported translations
 */
export const translations = {
  en,
  es,
  fr,
  de,
} as const;

export type Language = keyof typeof translations;
