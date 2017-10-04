import * as React from 'react';
import { storiesOf } from '@storybook/react';
import { Afm } from '@gooddata/data-layer';

import * as sdk from 'gooddata';
import get = require('lodash/get');
import { Visualization as IndigoVisualization } from '@gooddata/indigo-visualizations';

import { Visualization, IVisualizationProps } from '../src/components/uri/Visualization';

import '../styles/scss/charts.scss';
import '../styles/scss/table.scss';
import { onErrorHandler } from './mocks';

const defaultFilter: Afm.IFilter = {
    id: '/gdc/md/myproject/obj/123',
    type: 'date',
    intervalType: 'absolute',
    granularity: 'date',
    between: ['2017-01-01', '2017-12-31']
};

class DynamicVisualization extends React.Component<any, any> {
    initialProps: IVisualizationProps = {
        projectId: 'myproject',
        uri: '/gdc/md/myproject/obj/1001',
        config: {
            colors: [
                'rgba(195, 49, 73, 1)',
                'rgba(168, 194, 86, 1)',
                'rgba(243, 217, 177, 1)',
                'rgba(194, 153, 121, 1)',
                'rgba(162, 37, 34, 1)'
            ]
        },
        filters: [defaultFilter]
    };

    alternativeProps: IVisualizationProps = {
        projectId: 'myproject',
        uri: '/gdc/md/myproject/obj/1002',
        config: {},
        filters: []
    };

    onLoadingChanged = ({ isLoading }) => {
        this.setState({ isLoading });
    }

    constructor(nextProps) {
        super(nextProps);
        this.state = this.initialProps;
    }

    toggle(prop) {
        this.setState({
            [prop]: this.state[prop] === this.initialProps[prop] ?
            this.alternativeProps[prop] :
            this.initialProps[prop]
        });
    }

    render() {
        return (
            <div>
                <div>
                    <button onClick={this.toggle.bind(this, 'uri')} >toggle uri</button>
                    <button onClick={this.toggle.bind(this, 'filters')} >toggle filter</button>
                    <button onClick={this.toggle.bind(this, 'config')} >toggle config</button>
                </div>
                <Visualization
                    key="dynamic-test-vis"
                    onLoadingChanged={this.onLoadingChanged}
                    onError={onErrorHandler}
                    {...this.state}
                />
                { this.state.isLoading ? <div className="gd-spinner large" style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    margin: '-16px 0 0 -16px'
                }} ></div> : null }
            </div>
        );
    }
}

class TransformationVisualization extends React.Component<any, any> {
    onLoadingChanged = ({ isLoading }) => {
        this.setState({ isLoading });
    }

    constructor(nextProps) {
        super(nextProps);
        this.state = {
            isLoading: true
        };
    }

    componentWillMount() {
        const { afmTransformation } = this.props;

        const transformationRequest = {
            afmTransformation: {
                afm: {
                    ...afmTransformation.afm,
                    measures: afmTransformation.afm.measures.map((measure) => {
                        return {
                            definition: {
                                measure: {
                                    item: {
                                        uri: measure.definition.baseObject.id
                                    },
                                    aggregation: measure.definition.aggregation.toString().toUpperCase()
                                }
                            },
                            localIdentifier: measure.id,
                            alias: 'Sum of Sales'
                        };
                    })
                }
            }
        };

        const transformationUrl = '/gdc/app/projects/FoodMartDemo/execute/transform';

        return sdk.xhr.post(transformationUrl, {
            body: JSON.stringify(transformationRequest)
        })
        .then(result => result.json())
        .then((result) => {
            return sdk.xhr.get(result.uri);
        })
        .then((result) => {
            const rawData = result.transformationResponse
            .dimensions[0].headers.reduce((output, header) => {
                return output.length === 0 ? header.labels.map(({ id, value }) => {
                    return [header.type === 'metric'
                        ? result.transformationResponse.data.shift()
                        : { id, name: value }
                    ];
                }) : header.labels.reduce((newOutput, { id, value }) => {
                    return newOutput.concat(output.map((outputItem) => {
                        return [...outputItem, header.type === 'metric'
                            ? result.transformationResponse.data.shift()
                            : { id, name: value }
                        ];
                    }));
                }, []);
            }, []);

            const expectedProps = {
                afm: {
                    attributes: [],
                    measures: [
                        {
                            id: 'm1',
                            definition: {
                                baseObject: {
                                    id: '/gdc/md/FoodMartDemo/obj/1'
                                },
                                aggregation: 'sum'
                            }
                        }
                    ],
                    filters: []
                },
                height: 676,
                config: {
                    type: 'column',
                    buckets: {
                        measures: [
                            {
                                measure: {
                                    aggregation: 'sum',
                                    showInPercent: false,
                                    objectUri: '/gdc/md/FoodMartDemo/obj/1',
                                    showPoP: false,
                                    format: '#,##0.00',
                                    title: 'Sum of Accounting Amount',
                                    type: 'fact',
                                    measureFilters: []
                                }
                            }
                        ],
                        categories: [],
                        filters: []
                    },
                    legend: {
                        enabled: true,
                        position: 'top'
                    }
                },
                drillableItems: [],
                numericSymbols: ['k', 'M', 'G', 'T', 'P', 'E'],
                data: {
                    isLoaded: true,
                    headers: [
                        {
                            type: 'metric',
                            id: 'm1',
                            title: 'Sum of Accounting Amount',
                            format: '#,##0.00'
                        }
                    ],
                    rawData: [
                        [
                            '2356056.57999999'
                        ]
                    ],
                    warnings: [],
                    isEmpty: false
                }
            };

            const data = {
                headers: get(result, 'transformationResponse.dimensions', [])
                .reduce((allDimensionHeaders, dimension) => {
                    return allDimensionHeaders.concat(dimension.headers.reduce((collectedHeaders, header) => {
                        return collectedHeaders.concat(header.labels.map((label) => {
                            return {
                                type: label.type,
                                id: label.id,
                                title: label.value
                            };
                        }));
                    }, []));
                }, []),
                rawData, // generated earlier from transformationResponse.data
                warnings: [],
                isLoaded: true,
                isEmpty: false // !!!
            };
            const actualProps = {
                ...expectedProps,
                afm: afmTransformation.afm,
                data
            };

            return Promise.resolve(actualProps);
        })
        .then((props) => {
            this.setState({
                props,
                isLoading: false
            });
        });
    }

    render() {
        const { isLoading, props } = this.state;
        return (
            <div style={{ position: 'relative', height: 800 }}>
                { isLoading ? '...' : <IndigoVisualization {...props} /> }
            </div>
        );
    }
}

storiesOf('Visualization', module)
    .add('table example', () => (
        <div style={{ width: 800, height: 400 }}>
            <Visualization
                projectId="myproject"
                uri={'/gdc/md/myproject/obj/1001'}
                onError={onErrorHandler}
            />
        </div>
    ))
    .add('table example with identifier', () => (
        <div style={{ width: 800, height: 400 }}>
            <Visualization
                projectId="myproject"
                identifier="1001"
                onError={onErrorHandler}
            />
        </div>
    ))
    .add('chart example', () => (
        <div style={{ width: 800, height: 400 }}>
            <Visualization
                projectId="myproject"
                uri={'/gdc/md/myproject/obj/1002'}
                onError={onErrorHandler}
            />
        </div>
    ))
    .add('chart with custom colors example', () => (
        <div style={{ width: 800, height: 400 }}>
            <Visualization
                projectId="myproject"
                uri={'/gdc/md/myproject/obj/1002'}
                config={{
                    colors: [
                        'rgba(195, 49, 73, 1)',
                        'rgba(168, 194, 86, 1)',
                        'rgba(243, 217, 177, 1)',
                        'rgba(194, 153, 121, 1)',
                        'rgba(162, 37, 34, 1)'
                    ]
                }}
                onError={onErrorHandler}
            />
        </div>
    ))
    .add('chart with applied filter', () => {
        const filter: Afm.IFilter = {
            id: '/gdc/md/myproject/obj/123',
            type: 'date',
            intervalType: 'absolute',
            granularity: 'date',
            between: ['2017-01-01', '2017-12-31']
        };
        return (
            <div style={{ width: 800, height: 400 }}>
                <Visualization
                    projectId="myproject"
                    uri={'/gdc/md/myproject/obj/1002'}
                    filters={[filter]}
                    onError={onErrorHandler}
                />
            </div>
        );
    })
    .add('dynamic visualization test', () => (
        <div style={{ width: 800, height: 400, position: 'relative' }}>
            <DynamicVisualization />
        </div>
    ))
    .add('visualization newTransformation bar chart', () => {
        const barChartAfm = {
            afm: {
                measures: [
                    {
                        id: '8d7cb098877e20a823608e2d8d115b95',
                        definition: {
                            filters: [],
                            baseObject: {
                                id: '/gdc/md/hdint8y1xvk9oyns1r0iefknwivzlb4g/obj/15415'
                            },
                            showInPercent: false,
                            aggregation: 'SUM'
                        }
                    }
                ],
                attributes: [],
                filters: []
            },
            transformation: {
                measures: [
                    {
                        id: '8d7cb098877e20a823608e2d8d115b95',
                        title: 'Sum of Sales',
                        format: '#,##0.00'
                    }
                ],
                sorting: []
            }
        };

        return (<div style={{ position: 'relative', height: 800 }}>
            <TransformationVisualization
                afmTransformation={barChartAfm}
            />
        </div>);
    });
