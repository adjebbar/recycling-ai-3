"use client";

import { useTranslation } from "react-i18next";

export const AppFooter = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
      <p className="mb-1">
        {t('footer.author', 'Author')}: NewTech corp. (adjebbar@zohomail.com)
      </p>
      <p className="mb-1">
        &copy; {currentYear} {t('footer.copyright', 'NewTech corp. All rights reserved.')}
      </p>
      <a
        href="https://www.dyad.sh/"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-gray-700 dark:hover:text-gray-200"
      >
        Made with Dyad
      </a>
    </footer>
  );
};