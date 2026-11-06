/**
 * SAS Music Configuration
 * 
 * Configured with user's Google Drive Folder ID and API Key.
 */

export const DRIVE_FOLDER_ID = 
  import.meta.env.VITE_DRIVE_FOLDER_ID || "";

export const DRIVE_API_KEY = 
  import.meta.env.VITE_DRIVE_API_KEY || "";

/**
 * Returns active configuration with localStorage fallback.
 * Allows users to test their API keys and Folder IDs right from the browser UI!
 */
export function getActiveConfig() {
  const localFolderId = typeof window !== 'undefined' ? localStorage.getItem('sas_folder_id') : null;
  const localApiKey = typeof window !== 'undefined' ? localStorage.getItem('sas_api_key') : null;

  const folderId = (localFolderId && localFolderId.trim()) || DRIVE_FOLDER_ID;
  const apiKey = (localApiKey && localApiKey.trim()) || DRIVE_API_KEY;

  const isConfigured = 
    folderId && 
    apiKey && 
    folderId !== "PASTE_FOLDER_ID_HERE" && 
    apiKey !== "PASTE_API_KEY_HERE" &&
    folderId.trim().length > 0 &&
    apiKey.trim().length > 0;

  return {
    folderId,
    apiKey,
    isConfigured: Boolean(isConfigured)
  };
}

/**
 * Updates localStorage configuration overrides
 */
export function saveConfigOverride(folderId, apiKey) {
  if (typeof window !== 'undefined') {
    if (folderId) localStorage.setItem('sas_folder_id', folderId.trim());
    else localStorage.removeItem('sas_folder_id');

    if (apiKey) localStorage.setItem('sas_api_key', apiKey.trim());
    else localStorage.removeItem('sas_api_key');
  }
}
