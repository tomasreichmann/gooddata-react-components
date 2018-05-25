// (C) 2007-2018 GoodData Corporation

const demoProject = {
    'https://secure.gooddata.com': 'k26dtejorcqlqf11crn6imbeevp2q4kg',
    'https://staging3.intgdc.com': 'kytra720hke4d84e8ozohoz7uycn53mi',
    'https://staging2.intgdc.com': 'ws7pxsamkx8o0t1s7kfvkj5o41uwcmqg',
    'https://staging.intgdc.com': 'na1q8a0q4efb7cajbgre9mmm776dr1yv',
    'https://client-demo-be.na.intgdc.com': '',
    'https://developer.na.gooddata.com': 'xms7ga4tf3g3nzucd8380o2bev8oeknp'
};

const backendUrl = BACKEND_URL; // eslint-disable-line no-undef
const demoProjectId = demoProject[backendUrl];
if (!demoProjectId) {
    console.error(`[fixtures.js] ProjectId for backend "${backendUrl}" is not in `, demoProject); // eslint-disable-line no-console
}

console.log('The /gdc proxy is connected to: ', backendUrl, ' with projectId: ', demoProjectId); // eslint-disable-line no-console

// your projectId would be probably static (you may ignore the code above)

export const backendUrlForInfo = backendUrl;
export const projectId = demoProjectId;

export const averageCheckSizeByServer = 'afewRzGAersh';
export const averageDailyTotalSales = 'aagJGHg1bxap';
export const columnVisualizationIdentifier = 'acFJltTsifSQ';
export const dateDatasetIdentifier = 'date.dataset.dt';
export const employeeNameIdentifier = 'label.employee.employeename';
export const franchiseFeesAdRoyaltyIdentifier = 'aabHeqImaK0d';
export const franchiseFeesIdentifier = 'aaEGaXAEgB7U';
export const franchiseFeesIdentifierOngoingRoyalty = 'aaWGcgnsfxIg';
export const franchiseFeesInitialFranchiseFeeIdentifier = 'aaDHcv6wevkl';
export const franchiseFeesTag = 'franchise_fees';
export const franchiseFeesVisualizationIdentifier = 'aahnVeLugyFj';
export const locationCityAttributeIdentifier = 'attr.restaurantlocation.locationcity';
export const locationCityAttributeUri = '/gdc/md/k26dtejorcqlqf11crn6imbeevp2q4kg/obj/2208';
export const locationCityDisplayFormIdentifier = 'label.restaurantlocation.locationcity';
export const locationIdAttributeIdentifier = 'attr.restaurantlocation.locationid';
export const locationNameAttributeUri = '/gdc/md/k26dtejorcqlqf11crn6imbeevp2q4kg/obj/2204';
export const locationNameDisplayFormIdentifier = 'label.restaurantlocation.locationname';
export const locationResortIdentifier = 'label.restaurantlocation.locationresort';
export const locationStateAttributeIdentifier = 'attr.restaurantlocation.locationstate';
export const locationStateAttributeUri = '/gdc/md/k26dtejorcqlqf11crn6imbeevp2q4kg/obj/2210';
export const locationStateDisplayFormIdentifier = 'label.restaurantlocation.locationstate';
export const menuCategoryAttributeDFIdentifier = 'label.menuitem.menucategory';
export const menuItemNameAttributeDFIdentifier = 'label.menuitem.menuitemname';
export const yearDateIdentifier = 'date.aag81lMifn6q';
export const quarterDateIdentifier = 'date.aci81lMifn6q';
export const monthDateIdentifier = 'date.abm81lMifn6q';
export const tableVisualizationIdentifier = 'aatFRvXBdilm';
export const totalSalesIdentifier = 'aa7ulGyKhIE5';
