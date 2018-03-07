/* eslint-disable react/jsx-closing-tag-location */
import React, { Component } from 'react';
import { Kpi } from '@gooddata/react-components';
import { factory as createSdk } from 'gooddata';

import '@gooddata/react-components/styles/css/main.css';

import { Loading } from './utils/Loading';
import { Error } from './utils/Error';

import { totalSalesIdentifier, projectId } from '../utils/fixtures';

const ALTERNATIVE_BACKEND_URI = '/backend2';

export class MultipleSdkSupportExample extends Component {
    componentWillMount() {
        this.alternativeSdk = createSdk({ domain: ALTERNATIVE_BACKEND_URI });
    }

    render() {
        return (
            <div className="wrapper" >
                <style jsx>{`
                    .wrapper {
                        display: flex;
                        justify-content: space-around;
                    }
                `}</style>
                <div>
                    <h2>{GDC}</h2>
                    <Kpi
                        projectId={projectId}
                        measure={totalSalesIdentifier}
                        LoadingComponent={Loading}
                        ErrorComponent={Error}
                    />
                </div>
                <div>
                    <h2>{ALTERNATIVE_BACKEND_URI}</h2>
                    <Kpi
                        sdk={this.alternativeSdk}
                        projectId={projectId}
                        measure={totalSalesIdentifier}
                        LoadingComponent={Loading}
                        ErrorComponent={Error}
                    />
                </div>
            </div>
        );
    }
}

export default MultipleSdkSupportExample;
