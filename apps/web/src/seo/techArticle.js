const SITE_URL = 'https://www.sviluppolamiera.it';

export function techArticleHead({ path, title, description, headline, faqs }) {
  const url = `${SITE_URL}${path}`;
  return {
    title,
    meta: [
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: url },
    ],
    link: [{ rel: 'canonical', href: url }],
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'TechArticle',
              headline,
              description,
              inLanguage: 'it',
              mainEntityOfPage: url,
              author: { '@type': 'Person', name: 'Loris Di Furio' },
              publisher: { '@id': `${SITE_URL}/#organization` },
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
                { '@type': 'ListItem', position: 2, name: headline, item: url },
              ],
            },
            {
              '@type': 'FAQPage',
              mainEntity: faqs.map(item => ({
                '@type': 'Question',
                name: item.q,
                acceptedAnswer: { '@type': 'Answer', text: item.a },
              })),
            },
          ],
        }),
      },
    ],
  };
}
