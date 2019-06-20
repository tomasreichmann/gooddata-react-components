// (C) 2007-2019 GoodData Corporation
/* eslint-disable react/jsx-closing-tag-location */
import React, { Component } from "react";
import { BucketExecutor, LoadingComponent, ErrorComponent, Model } from "@gooddata/react-components";

import { totalSalesIdentifier, projectId, locationStateDisplayFormIdentifier } from "../utils/fixtures";

const presets = {
    kpi: {
        dimensions: [[Model.measure(totalSalesIdentifier)]],
        label: "KPI",
        // eslint-disable-next-line react/prop-types
        DataComponent: ({ result, ...restProps }) => {
            console.log('kpi result', result, restProps);
            return (
                <p
                    className="s-bucket-executor-kpi"
                    style={{
                        height: 60,
                        margin: '10px 0',
                        fontSize: 50,
                        lineHeight: '60px',
                        whiteSpace: 'nowrap',
                        verticalAlign: 'bottom',
                        fontWeight: 700,
                    }}
                >
                    {result.data[0]}
                </p>
            );
        }
    },
    attributeValueList: {
        dimensions: [[Model.attribute(locationStateDisplayFormIdentifier)]],
        label: "List of States",
        // eslint-disable-next-line react/prop-types
        DataComponent: ({ result, ...restProps }) => {
            console.log('attributeValueList result', result, restProps);
            return (
                <p
                    className="s-bucket-executor-kpi"
                    style={{
                        height: 60,
                        margin: '10px 0',
                        fontSize: 50,
                        lineHeight: '60px',
                        whiteSpace: 'nowrap',
                        verticalAlign: 'bottom',
                        fontWeight: 700,
                    }}
                >
                    {result.headerItems[0][0].map(header => header.attributeHeaderItem.name).join(', ')}
                </p>
            );
        }
    }
}

export class BucketExecutorExample extends Component {
    constructor(props) {
        super(props);

        // We need to track error and isLoading states, executionNumber to force remount of execution component
        this.state = {
            executionNumber: 0,
            selectedPresetKey: Object.keys(presets)[0]
        };
    }

    setPreset = (selectedPresetKey) => {
        this.setState({
            executionNumber: this.state.executionNumber + 1,
            selectedPresetKey
        });
    }

    render() {
        const { executionNumber, selectedPresetKey } = this.state;
        return (
            <div>
                {/*
                    We need to render the Execute component even in loading
                    otherwise the ongoing request is cancelled
                */}
                <p>
                    {Object.keys(presets).map(presetKey => {
                        const preset = presets[presetKey];
                        return (
                            <button key={presetKey} onClick={() => this.setPreset(presetKey)} className="button button-action s-retry-button">
                                {preset.label}
                            </button>
                        );
                    })}

                </p>
                <BucketExecutor
                    // force reload using executionNumber
                    // key={executionNumber}
                    projectId={projectId}
                    dimensions={presets[selectedPresetKey].dimensions}
                >
                    {(childrenProps) => {
                        const { result, response, isLoading, error } = childrenProps;
                        console.log('{ result, response, isLoading, error }', { result, response, isLoading, error });

                        if (error) {
                            return (
                                <div>
                                    <div className="gd-message error">
                                        <div className="gd-message-text">Oops, error.</div>
                                    </div>
                                    <ErrorComponent
                                        message="There was an error getting your execution"
                                        description={JSON.stringify(error, null, 2)}
                                    />
                                </div>
                            );
                        }
                        if (isLoading) {
                            return (
                                <div>
                                    <div className="gd-message progress">
                                        <div className="gd-message-text">Loading…</div>
                                    </div>
                                    <LoadingComponent />
                                </div>
                            );
                        }
                        const { DataComponent } = presets[this.state.selectedPresetKey];
                        return (
                            <div>
                                {<DataComponent key={this.state.selectedPresetKey} {...childrenProps} />}
                                <p>Full execution response and result as JSON:</p>
                                <div
                                    style={{
                                        padding: "1rem",
                                        backgroundColor: "#EEE",
                                    }}
                                >
                                    <pre
                                        style={{
                                            maxHeight: 200,
                                            overflow: "auto",
                                            padding: "1rem",
                                        }}
                                    >
                                        {JSON.stringify({ response, result, isLoading, error }, null, "  ")}
                                    </pre>
                                </div>
                            </div>
                        );
                    }}
                </BucketExecutor>
            </div>
        );
    }
}

export default BucketExecutorExample;
