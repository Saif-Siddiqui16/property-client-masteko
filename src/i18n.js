import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: {
                translation: {
                    "navbar": {
                        "dashboard": "Dashboard",
                        "properties": "Properties",
                        "financials": "Financials",
                        "reports": "Reports",
                        "messages": "Messages"
                    },
                    "dashboard": {
                        "welcome": "Welcome back",
                        "portfolio_update": "Here is the update on your property portfolio performance.",
                        "total_properties": "Total Properties",
                        "total_units": "Total Units",
                        "vacant_units": "Vacant Units",
                        "vacant_bedrooms": "Vacant Bedrooms",
                        "outstanding_dues": "Outstanding Dues"
                    }
                }
            },
            fr: {
                translation: {
                    "navbar": {
                        "dashboard": "Tableau de bord",
                        "properties": "Propriétés",
                        "financials": "Finances",
                        "reports": "Rapports",
                        "messages": "Messages"
                    },
                    "dashboard": {
                        "welcome": "Bon retour",
                        "portfolio_update": "Voici la mise à jour sur la performance de votre portefeuille immobilier.",
                        "total_properties": "Total des propriétés",
                        "total_units": "Total des unités",
                        "vacant_units": "Unités vacantes",
                        "vacant_bedrooms": "Chambres vacantes",
                        "outstanding_dues": "Cotisations impayées"
                    }
                }
            }
        },
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
