import {Helmet} from 'react-helmet-async';
import {useTranslation} from 'react-i18next';
import {useLocation} from 'react-router-dom';
import routePaths from '../../app/router/routePaths.json';

const SITE_URL = (import.meta.env?.VITE_SITE_URL || 'https://agrolify.com').replace(/\/+$/, '');
const SITE_IMAGE_PATH = '/agrolify-icon.png';

const PAGE_META = {
    home: {
        path: routePaths.home,
        titleKey: 'seo.pages.home.title',
        descriptionKey: 'seo.pages.home.description',
        indexable: true,
        type: 'website',
        structuredData: true,
    },
    login: {
        path: routePaths.login,
        titleKey: 'seo.pages.login.title',
        descriptionKey: 'seo.pages.login.description',
    },
    register: {
        path: routePaths.register,
        titleKey: 'seo.pages.register.title',
        descriptionKey: 'seo.pages.register.description',
    },
    dashboard: {
        path: routePaths.dashboard,
        titleKey: 'seo.pages.dashboard.title',
        descriptionKey: 'seo.pages.dashboard.description',
    },
    profile: {
        path: routePaths.profile,
        titleKey: 'seo.pages.profile.title',
        descriptionKey: 'seo.pages.profile.description',
    },
    air: {
        path: routePaths.air,
        titleKey: 'seo.pages.air.title',
        descriptionKey: 'seo.pages.air.description',
    },
    soil: {
        path: routePaths.soil,
        titleKey: 'seo.pages.soil.title',
        descriptionKey: 'seo.pages.soil.description',
    },
    water: {
        path: routePaths.water,
        titleKey: 'seo.pages.water.title',
        descriptionKey: 'seo.pages.water.description',
    },
    map: {
        path: routePaths.map,
        titleKey: 'seo.pages.map.title',
        descriptionKey: 'seo.pages.map.description',
    },
    notFound: {
        titleKey: 'seo.pages.notFound.title',
        descriptionKey: 'seo.pages.notFound.description',
    },
};

const getAbsoluteUrl = (path = '/') => new URL(path, `${SITE_URL}/`).toString();

const getLocale = (language) => (language === 'el' ? 'el_GR' : 'en_US');

function PageHelmet({pageKey}) {
    const {t, i18n} = useTranslation();
    const location = useLocation();
    const pageMeta = PAGE_META[pageKey] || PAGE_META.notFound;
    const language = i18n.language === 'el' ? 'el' : 'en';
    const canonicalUrl = getAbsoluteUrl(pageMeta.path || location.pathname);
    const imageUrl = getAbsoluteUrl(SITE_IMAGE_PATH);
    const title = t(pageMeta.titleKey, {defaultValue: t('seo.defaultTitle')});
    const description = t(pageMeta.descriptionKey, {defaultValue: t('seo.defaultDescription')});
    const robots = pageMeta.indexable ? 'index, follow, max-image-preview:large' : 'noindex, nofollow';
    const structuredData = pageMeta.structuredData
        ? {
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: t('app.name'),
            url: getAbsoluteUrl(routePaths.home),
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            description: t('seo.defaultDescription'),
            publisher: {
                '@type': 'Organization',
                name: t('app.name'),
                url: getAbsoluteUrl(routePaths.home),
                logo: imageUrl,
            },
        }
        : null;

    return (
        <Helmet>
            <html lang={language} />
            <title>{title}</title>
            <link rel="canonical" href={canonicalUrl} />
            <link rel="alternate" href={canonicalUrl} hrefLang="x-default" />
            <link rel="alternate" href={canonicalUrl} hrefLang={language} />
            <meta name="description" content={description} />
            {pageMeta.indexable ? <meta name="keywords" content={t('seo.keywords')} /> : null}
            <meta name="robots" content={robots} />
            <meta name="googlebot" content={robots} />
            <meta property="og:type" content={pageMeta.type || 'website'} />
            <meta property="og:site_name" content={t('app.name')} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:image" content={imageUrl} />
            <meta property="og:image:type" content="image/png" />
            <meta property="og:image:width" content="256" />
            <meta property="og:image:height" content="256" />
            <meta property="og:locale" content={getLocale(language)} />
            <meta property="og:locale:alternate" content={getLocale(language === 'el' ? 'en' : 'el')} />
            <meta name="twitter:card" content="summary" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={imageUrl} />
            {structuredData ? (
                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
                </script>
            ) : null}
        </Helmet>
    );
}

export default PageHelmet;
