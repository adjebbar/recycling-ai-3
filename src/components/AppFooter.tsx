"use client";

import { useTranslation } from "react-i18next";

export const AppFooter = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="p-4 text-center text-sm text-gray-700 dark:text-gray-300 bg-background/50 backdrop-blur-lg">
      <p className="mb-1">
        {t('footer.copyrightLine1', `© ${currentYear} NewTech. All rights reserved.`)}
      </p>
      <p className="mb-1">
        {t('footer.copyrightLine2', 'Application developed by NewTech Corp.')}
      </p>
      <a
        href="https://www.dyad.sh/"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-gray-900 dark:hover:text-gray-100 text-primary"
      >
        Made with Dyad
      </a>
    </footer>
  );
};