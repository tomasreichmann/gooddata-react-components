import AdvancedUseCases from './AdvancedUseCases';
import AttributeFilter from './AttributeFilter';
import BasicComponents from './BasicComponents';
import GlobalFilters from './GlobalFilters';
import Home from './Home';
import Kpi from './Kpi';
import Visualization from './Visualization';
import Execute from './Execute';
import DatePicker from './DatePicker';
import ResponsiveChart from './ResponsiveChart';
import DynamicMeasures from './DynamicMeasures';
import MultipleSdkSupport from './MultipleSdkSupport';

export const advancedUseCasesRoutes = [
    { path: '/advanced/global-filters', title: 'Global Filters', Component: GlobalFilters },
    { path: '/advanced/dynamic-measures', title: 'Dynamic Measures', Component: DynamicMeasures },
    { path: '/advanced/date-picker', title: 'Date Picker', Component: DatePicker },
    { path: '/advanced/multiple-sdk-support', title: 'Multiple SDK Support', Component: MultipleSdkSupport },
    { path: '/advanced/responsive', title: 'Responsive Chart', Component: ResponsiveChart }
];

const AdvancedUseCasesWithProps = props => AdvancedUseCases({ ...props, advancedUseCasesRoutes });

export const mainRoutes = [
    { path: '/', title: 'Examples', Component: Home, exact: true },
    { path: '/basic-components', title: 'Basic Components', Component: BasicComponents },
    { path: '/kpi', title: 'KPIs', Component: Kpi },
    { path: '/visualization', title: 'Visualization', Component: Visualization },
    { path: '/attribute-filter-components', title: 'Attribute Filter Components', Component: AttributeFilter },
    { path: '/execute', title: 'Execute', Component: Execute },
    { path: '/advanced', pathMatch: 'full', redirectTo: advancedUseCasesRoutes[0].path, title: 'Advanced Use Cases', Component: AdvancedUseCasesWithProps }
];

export const routes = [
    ...mainRoutes,
    ...advancedUseCasesRoutes
];

const components = routes.map(r => r.component);

export const navigation = mainRoutes.map(({ path, title }) => ({
    href: path,
    title
}));

export default {
    advancedUseCasesRoutes,
    mainRoutes,
    routes,
    navigation,
    components
};
