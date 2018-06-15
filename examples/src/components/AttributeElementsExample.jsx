// (C) 2007-2018 GoodData Corporation
import React, { Component } from 'react';
import { AttributeElements, ColumnChart } from '@gooddata/react-components';
import PropTypes from 'prop-types';

import '@gooddata/react-components/styles/css/main.css';

import { employeeNameIdentifier, projectId } from '../utils/fixtures';

export class AttributeFilterItem extends Component {
    static propTypes = {
        title: PropTypes.string.isRequired,
        uri: PropTypes.string.isRequired,
        onChange: PropTypes.func.isRequired,
        isSelected: PropTypes.bool.isRequired
    };

    onChange = (uri) => {
        return event => this.props.onChange(uri, event.target.value === 'on');
    }

    render() {
        const { title, uri, isSelected } = this.props;
        return (
            <label className="gd-list-item s-attribute-filter-list-item" style={{ display: 'inline-flex' }}>
                <input type="checkbox" checked={isSelected} className="gd-input-checkbox" onChange={this.onChange(uri)} />
                <span>{title}</span>
            </label>
        );
    }
}

export class AttributeElementsExample extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selected: {}
        };
    }

    onChange = (uri, isSelected) => {
        this.setState({
            selected: {
                ...this.state.selected,
                [uri]: isSelected
            }
        });
    }

    render() {
        const { selected } = this.state;

        return (
            <div>
                <AttributeElements identifier={employeeNameIdentifier} projectId={projectId} options={{ limit: 20 }}>
                    {({ validElements, loadMore, isLoading, error }) => {
                        const {
                            offset = null,
                            count = null,
                            total = null
                        } = validElements ? validElements.paging : {};
                        if (error) {
                            return <div>{error}</div>;
                        }
                        const selectedUris = Object.keys(selected).filter(key => !!selected[key]);
                        const filters = selectedUris.length
                            ? [{
                                positiveAttributeFilter: {
                                    displayForm: {
                                        identifier: employeeNameIdentifier
                                    },
                                    in: selectedUris
                                }
                            }]
                            : [];
                        return (
                            <div>
                                <div style={{ height: 300, marginBottom: 20 }} >
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
                                <div>
                                    {validElements ? validElements.items.map(item => (
                                        <AttributeFilterItem
                                            key={item.element.uri}
                                            uri={item.element.uri}
                                            title={item.element.title}
                                            onChange={this.onChange}
                                            isSelected={!!selected[item.element.uri]}
                                        />
                                    )) : null}
                                </div>
                                <p>
                                    <button
                                        className="button button-secondary s-show-more-filters-button"
                                        onClick={loadMore}
                                        disabled={isLoading || (offset + count === total)}
                                    >Load more
                                    </button>
                                </p>
                                <div style={{ height: 300, overflow: 'auto' }} >
                                    <pre>
                                        isLoading: {isLoading.toString()}<br />
                                        offset: {offset}<br />
                                        count: {count}<br />
                                        total: {total}<br />
                                        nextOffset: {offset + count}
                                    </pre>
                                    {validElements ? <pre>{JSON.stringify(validElements, null, '  ')}</pre> : null}
                                </div>
                            </div>
                        );
                    }}
                </AttributeElements>
            </div>
        );
    }
}

export default AttributeElementsExample;
