// (C) 2007-2018 GoodData Corporation
import React, { Component } from 'react';
import { AttributeFilter, ColumnChart } from '@gooddata/react-components';

import '@gooddata/react-components/styles/css/main.css';

import { employeeNameIdentifier, projectId } from '../utils/fixtures';

export class AttributeFilterExample extends Component {
    constructor(props) {
        super(props);
        this.state = {
            filters: [],
            names: [],
            isPositive: false
        };
    }

    onApply = (filter) => {
        // eslint-disable-next-line no-console
        console.log('AttributeFilterExample filter', filter);

        const isPositive = !!filter.in;
        const elementsProp = isPositive ? 'in' : 'notIn';

        const filters = [{
            [isPositive ? 'positiveAttributeFilter' : 'negativeAttributeFilter']: {
                displayForm: {
                    uri: filter.id
                },
                [elementsProp]: filter[elementsProp].map(element => (`/gdc/md/xms7ga4tf3g3nzucd8380o2bev8oeknp/obj/2200/elements?id=${element}`))
            }
        }];

        this.setState({ filters, names: filter[elementsProp].map(element => element.title), isPositive });
    }

    render() {
        const { filters, names, isPositive } = this.state;
        return (
            <div>
                <AttributeFilter
                    identifier={employeeNameIdentifier}
                    projectId={projectId}
                    fullscreenOnMobile={false}
                    onApply={this.onApply}
                />&emsp;{(names.length && !isPositive && 'all employees except ') || null}{names.length ? names.join(', ') : 'all employees'}
                <hr className="separator" />
                <div style={{ height: 300 }}>
                    <ColumnChart
                        projectId="xms7ga4tf3g3nzucd8380o2bev8oeknp"
                        measures={[{
                            measure: {
                                localIdentifier: 'totalSales',
                                definition: {
                                    measureDefinition: {
                                        item: {
                                            identifier: 'aa7ulGyKhIE5'
                                        }
                                    }
                                }
                            }
                        }]}
                        filters={filters}
                    />
                </div>
            </div>
        );
    }
}

export default AttributeFilterExample;
