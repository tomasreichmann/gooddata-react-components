import React from 'react';
import ExampleWithSource from '../components/utils/ExampleWithSource';

import MultipleSdkSupportExample from '../components/MultipleSdkSupportExample';
import MultipleSdkSupportExampleSRC from '!raw-loader!../components/MultipleSdkSupportExample'; // eslint-disable-line import/no-webpack-loader-syntax, import/no-unresolved, import/extensions, import/first


export const MultipleSdkSupport = props => (
    <div>
        <h1>Multiple SDK Support</h1>

        <p>This is how you connect to two different backend domains.</p>

        <ExampleWithSource for={() => <MultipleSdkSupportExample {...props} />} source={MultipleSdkSupportExampleSRC} />
    </div>
);

export default MultipleSdkSupport;
