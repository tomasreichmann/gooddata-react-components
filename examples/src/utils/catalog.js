const catalogSecure = require('../../catalog-secure.json');
const catalogStaging2 = require('../../catalog-staging2.json');
const catalogStaging3 = require('../../catalog-staging3.json');
const catalogClientDemoBe = require('../../catalog-client-demo-be.json');

const catalogs = {
    secure: catalogSecure,
    staging2: catalogStaging2,
    staging3: catalogStaging3,
    'client-demo-be': catalogClientDemoBe
};

export const catalog = (() => {
    if (typeof window !== 'undefined') {
        const { hostname } = window.location;
        let key = hostname.split('.')[0];
        if (key === 'localhost') {
            const gdc = GDC; // eslint-disable-line no-undef
            const gdcHostname = /https?:\/\/([\w]+)/.exec(gdc)[1];
            if (!(gdcHostname in catalogs)) {
                return null;
            }
            key = gdcHostname;
        }

        return catalogs[key];
    }
    return null;
})();
