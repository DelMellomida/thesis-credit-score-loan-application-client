import type { FormData } from "../../app/page";

const FORM_STORAGE_KEY = 'loan_application_form_data';
const FILES_STORAGE_KEY = 'loan_application_files';

// Saves form data to localStorage
export function saveFormData(data: FormData) {
  try {
    const payload = JSON.stringify(data);
    localStorage.setItem(FORM_STORAGE_KEY, payload);
  } catch (error) {
    console.error('[formStorage] Error saving form data:', error);
  }
}

// Loads form data from localStorage
export function loadFormData(): FormData | null {
  try {
    const saved = localStorage.getItem(FORM_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('[formStorage] Error loading form data:', error);
    return null;
  }
}

// Clears form data from localStorage
export function clearFormData() {
  try {
    localStorage.removeItem(FORM_STORAGE_KEY);
  } catch (error) {
    console.error('[formStorage] Error clearing form data:', error);
  }
}

// Saves file metadata and data URLs to localStorage
export function saveFiles(files: Record<string, { name: string; type: string; size: number; dataUrl: string } | null>) {
  try {
    localStorage.setItem(FILES_STORAGE_KEY, JSON.stringify(files));
  } catch (error) {
    console.error('[formStorage] Error saving files:', error);
  }
}

// Loads file metadata and data URLs from localStorage
export function loadFiles(): Record<string, { name: string; type: string; size: number; dataUrl: string } | null> | null {
  try {
    const saved = localStorage.getItem(FILES_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('[formStorage] Error loading files:', error);
    return null;
  }
}

// Clears file data from localStorage
export function clearFiles() {
  try {
    localStorage.removeItem(FILES_STORAGE_KEY);
  } catch (error) {
    console.error('[formStorage] Error clearing files:', error);
  }
}