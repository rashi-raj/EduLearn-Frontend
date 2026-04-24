import { Injectable, signal } from '@angular/core';

export type AppLanguage = 'en' | 'hi';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly storageKey = 'edulearn_language';

  currentLanguage = signal<AppLanguage>('en');
  translations = signal<Record<string, any>>({});

  async init(): Promise<void> {
    const saved = (localStorage.getItem(this.storageKey) as AppLanguage | null) || 'en';
    await this.useLanguage(saved);
  }

  async useLanguage(lang: AppLanguage): Promise<void> {
    try {
      const response = await fetch(`/assets/i18n/${lang}.json`);
      const json = await response.json();

      this.currentLanguage.set(lang);
      this.translations.set(json);
      localStorage.setItem(this.storageKey, lang);
    } catch (error) {
      console.error(`Failed to load language file for ${lang}`, error);

      if (lang !== 'en') {
        await this.useLanguage('en');
      }
    }
  }

  getCurrentLanguage(): AppLanguage {
    return this.currentLanguage();
  }

  t(key: string): string {
    const keys = key.split('.');
    let value: any = this.translations();

    for (const part of keys) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return key;
      }
    }

    return typeof value === 'string' ? value : key;
  }
}