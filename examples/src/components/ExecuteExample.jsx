// (C) 2007-2018 GoodData Corporation
/* eslint-disable react/jsx-closing-tag-location */
import React, { Component } from 'react';
import { Execute, LoadingComponent, ErrorComponent, isEmptyResult } from '@gooddata/react-components';
import { totalSalesIdentifier, projectId } from '../utils/fixtures';

export class ExecuteExample extends Component {
    constructor(props) {
        super(props);

        // We need to track error and isLoading states, executionNumber to force remount of execution component
        this.state = {
            executionNumber: 0,
            willFail: true
        };
        this.onLoadingChanged = this.onLoadingChanged.bind(this);
        this.onError = this.onError.bind(this);
        this.retry = this.retry.bind(this);
    }

    onLoadingChanged({ isLoading }) {
        // eslint-disable-next-line no-console
        console.log('isLoading', isLoading);
        // onLoadingChanged must reset error, so that we are not in error during loading
        // onError is run after onLoadingChanged, so we do not have to worry about overriding current error
    }

    onError(error) {
        // eslint-disable-next-line no-console
        console.log('onError', error);
    }

    retry() {
        // eslint-disable-next-line no-console
        console.log('retry');
        // We need to track executionNumber so that we can remount Execute component
        // In order to showcase error states, here we also decide if the next execution will fail or not
        this.setState({
            executionNumber: this.state.executionNumber + 1,
            willFail: this.state.executionNumber % 2
        });
    }

    executeChildrenFunction({ result, isLoading, error }) {
        if (error) {
            return <ErrorComponent message="There was an error getting your execution" description={JSON.stringify(error, null, '  ')} />;
        }
        if (isLoading) {
            return <LoadingComponent />;
        }
        return (
            <div>
                <style jsx>{`
                    .kpi {
                        height: 60px;
                        margin: 10px 0;
                        font-size: 50px;
                        line-height: 60px;
                        white-space: nowrap;
                        vertical-align: bottom;
                        font-weight: 700;
                    }
                `}</style>
                <p className="kpi s-execute-kpi">{result.executionResult.data[0]}</p>
                <p>Full execution response and result as JSON:</p>
                <pre>{JSON.stringify({ result, isLoading, error }, null, '  ')}</pre>
            </div>
        );
    }

    render() {
        const { willFail } = this.state;
        const afm = {
            measures: [
                {
                    localIdentifier: 'measure',
                    definition: {
                        measure: {
                            item: {
                                // In order to showcase the fail state, we send invalid measure uri
                                identifier: willFail ? totalSalesIdentifier : null
                            }
                        }
                    }
                }
            ]
        };

        return (
            <div>
                <p>
                    <button onClick={this.retry} className="button button-action s-retry-button">Retry</button>
                    &ensp;(fails every second attempt)
                </p>
                {/*
                    We need to render the Execute component even in loading
                    otherwise the ongoing request is cancelled
                */}


                <Execute afm={afm} projectId={projectId} onLoadingChanged={e => e} onError={e => e} >
                    {
                        (execution) => {
                            const { isLoading, error, result } = execution;
                            if (isLoading) {
                                return (<div>Loading data...</div>);
                            } else if (error) {
                                return (<div>There was an error</div>);
                            }

                            return isEmptyResult(result) ? (
                                <div>Empty result</div>) : (<div>{JSON.stringify(result.executionResult)}</div>);
                        }
                    }
                </Execute>
            </div>
        );
    }
}

export default ExecuteExample;
