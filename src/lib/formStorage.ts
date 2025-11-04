import type { FormData } from "../app/page";

const FORM_STORAGE_KEY = 'loan_application_form_data';
const FILES_STORAGE_KEY = 'loan_application_files';

export function saveFormData(data: FormData) {
  try {
    const payload = JSON.stringify(data);
    localStorage.setItem(FORM_STORAGE_KEY, payload);
  // debug log to help diagnose persistence issues
  // eslint-disable-next-line no-console
//   console.log('[formStorage] saveFormData called — saved keys:', Object.keys(data).join(','));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[formStorage] Error saving form data:', error);
  }
}

export function loadFormData(): FormData | null {
  try {
    const saved = localStorage.getItem(FORM_STORAGE_KEY);
  // eslint-disable-next-line no-console
//   console.log('[formStorage] loadFormData called — found:', !!saved);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[formStorage] Error loading form data:', error);
    return null;
  }
}

export function clearFormData() {
  try {
    localStorage.removeItem(FORM_STORAGE_KEY);
  // eslint-disable-next-line no-console
//   console.log('[formStorage] clearFormData called');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[formStorage] Error clearing form data:', error);
  }
}

export function saveFiles(files: Record<string, { name: string; type: string; size: number; dataUrl: string } | null>) {
  try {
    localStorage.setItem(FILES_STORAGE_KEY, JSON.stringify(files));
    // eslint-disable-next-line no-console
    // console.log('[formStorage] saveFiles called — keys:', Object.keys(files).join(','));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[formStorage] Error saving files:', error);
  }
}

export function loadFiles(): Record<string, { name: string; type: string; size: number; dataUrl: string } | null> | null {
  try {
    const saved = localStorage.getItem(FILES_STORAGE_KEY);
    // eslint-disable-next-line no-console
    // console.log('[formStorage] loadFiles called — found:', !!saved);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[formStorage] Error loading files:', error);
    return null;
  }
}

export function clearFiles() {
  try {
    localStorage.removeItem(FILES_STORAGE_KEY);
    // eslint-disable-next-line no-console
    // console.log('[formStorage] clearFiles called');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[formStorage] Error clearing files:', error);
  }
}