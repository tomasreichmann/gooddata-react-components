// (C) 2007-2018 GoodData Corporation
import * as React from "react";
import { SDK, factory as createSdk } from "@gooddata/gooddata-js";
import { AFM, Execution, VisualizationObject, VisualizationInput } from "@gooddata/typings";

import { IEvents } from "../interfaces/Events";
import { setTelemetryHeaders } from "../helpers/utils";
import { convertErrors } from "../helpers/errorHandlers";
import { RuntimeError } from "../errors/RuntimeError";
import { convertBucketsToAFM } from "../helpers/conversion";
import { MEASURES, ATTRIBUTES } from "../constants/bucketNames";
import { MEASUREGROUP } from "../internal/constants/bucket";

type dimensionItem = VisualizationInput.AttributeOrMeasure | VisualizationInput.IAttribute;

export const getExecutionFromDimensions = (
    dimensions: dimensionItem[][],
    filters: VisualizationInput.IFilter[],
    sorts: VisualizationInput.ISort[],
): AFM.IExecution => {
    const measuresBucket: VisualizationObject.IBucket = {
        localIdentifier: MEASURES,
        items: [],
        // TODO: totals
    };
    const attributesBucket: VisualizationObject.IBucket = {
        localIdentifier: ATTRIBUTES,
        items: [],
        // TODO: totals
    };

    const resultSpec: AFM.IResultSpec = {
        dimensions: [],
        sorts,
    };

    let measureDimension: number | null = null;

    dimensions.forEach((dimension, dimensionIndex) => {
        const itemIdentifiers: string[] = [];
        dimension.forEach(dimensionItem => {
            if (VisualizationInput.isAttribute(dimensionItem)) {
                itemIdentifiers.push(dimensionItem.visualizationAttribute.localIdentifier);
                attributesBucket.items.push(dimensionItem);
            } else if (VisualizationInput.isMeasure(dimensionItem)) {
                const measureLocalIdentifier = dimensionItem.measure.localIdentifier;
                if (measureDimension === null) {
                    measureDimension = dimensionIndex;
                    itemIdentifiers.push(MEASUREGROUP);
                } else if (measureDimension !== dimensionIndex) {
                    throw new RuntimeError(
                        `All measures have to be on the same dimension. There are some measures already on dimension ${measureDimension} but measure ${measureLocalIdentifier} is on dimension ${dimensionIndex}.`,
                    );
                }
                measuresBucket.items.push(dimensionItem);
            }
            resultSpec.dimensions.push({
                itemIdentifiers,
                // TODO: totals
            });
        });
    });

    const buckets: VisualizationObject.IBucket[] = [];
    if (attributesBucket.items.length > 0) {
        buckets.push(attributesBucket);
    }
    if (measuresBucket.items.length > 0) {
        buckets.push(measuresBucket);
    }
    if (buckets.length === 0) {
        throw new RuntimeError("No measures nor attributes defined");
    }

    const afm = convertBucketsToAFM(buckets, filters);

    return {
        execution: {
            afm,
            resultSpec,
        },
    };
};

export interface IPaging {
    offset: number[];
    limit: number[];
}

export interface IBucketExecutorChildrenProps {
    isLoading: boolean;
    error: any;
    result: Execution.IExecutionResult | null;
    response: Execution.IExecutionResponse | null;
    getPage: (paging: IPaging) => void;
}

export interface IBucketExecutorProps extends IEvents {
    projectId: string;
    children: (childrenProps: IBucketExecutorChildrenProps) => React.ReactNode;
    sdk?: SDK;
    telemetryComponentName?: string;
    dimensions: dimensionItem[][];
    filters: VisualizationInput.IFilter[];
    sortBy: VisualizationInput.ISort[];
    autoLoadFirstPage: boolean;
    initialPaging: IPaging;
}

export interface IBucketExecutorState {
    result: Execution.IExecutionResult | null;
    response: Execution.IExecutionResponse | null;
    isLoading: boolean;
    error: any;
    responsePromise: Promise<Execution.IExecutionResponse> | null;
    resultPromise: Promise<Execution.IExecutionResult> | null;
    fingerprint: any;
    children: (childrenProps: IBucketExecutorChildrenProps) => React.ReactNode
}

export interface IBucketExecutorChildrenProps {
    response: Execution.IExecutionResponse | null;
    result: Execution.IExecutionResult | null;
    isLoading: boolean;
    error: any;
    getPage: (paging: IPaging) => void;
}

const propsRequiringDataReset = [
    'sdk', 'projectId', 'dimensions', 'filters', 'sortBy'
];

const didPropsChange = <V,>(propList: string[], prevProps: V, props: V): boolean => {
    for (const propName of propList) {
        const prevProp = prevProps[propName];
        const prop = props[propName];
        if (prop !== prevProp) {
            return true;
        }
    }
    return false;
}

const getFingerprint = (props: IBucketExecutorProps) => Object.assign({}, ...propsRequiringDataReset.map(propName => ({
    [propName]: props[propName]
})));

export class BucketExecutor extends React.Component<IBucketExecutorProps, IBucketExecutorState> {
    public static defaultProps: Partial<IBucketExecutorProps> = {
        sdk: createSdk(),
        filters: [],
        sortBy: [],
        autoLoadFirstPage: true,
    };

    public static getDerivedStateFromProps(props: IBucketExecutorProps, state: IBucketExecutorState) {
        const fingerprint = getFingerprint(props);
        return {fingerprint};
    }

    public fingerprint: any;

    public state: IBucketExecutorState;

    public hasUnmounted: boolean = false;

    private sdk: SDK;

    constructor(props: IBucketExecutorProps) {
        super(props);
        this.state = {
            result: null,
            response: null,
            isLoading: props.autoLoadFirstPage,
            error: null,
            responsePromise: null,
            resultPromise: null,
            children: props.children,
            fingerprint: getFingerprint(props),
        };
        this.hasUnmounted = false;
        this.onSdkChanged();
    }

    public fingerprintMatches = (props: IBucketExecutorProps) => {
        const { fingerprint } = this.state;
        const currentFingerprint = getFingerprint(props);
        return Object.keys(fingerprint).some((key) => {
            return fingerprint[key] !== currentFingerprint[key]
        })
    }

    public onSdkChanged = () => {
        const { sdk } = this.props;
        this.sdk = sdk ? sdk.clone() : createSdk();
        setTelemetryHeaders(this.sdk, "BucketExecutor", this.props);
    };

    public componentDidMount() {
        this.getResponse();
    }

    public componentWillUnmount() {
        this.hasUnmounted = true;
    }

    public componentDidUpdate(prevProps: IBucketExecutorProps) {
        console.log('componentDidUpdate');
        const { sdk, children } = this.props;
        // refresh response if needed
        // if (prevProps.children !== children) {
        //     console.log('componentDidUpdate children');
        //     this.setState({ children });
        // }
        if (prevProps.sdk !== sdk) {
            this.onSdkChanged();
        }
        if (didPropsChange(propsRequiringDataReset, prevProps, this.props)) {
            this.getResponse();
        }
    }

    public getPage = (paging: IPaging) => {
        const { response } = this.state;
        if (this.hasUnmounted) {
            // tslint:disable-next-line:no-console
            console.warn("You are calling a component that is already unmounted");
        }
        if (!response) {
            throw new RuntimeError("response not yet ready. Do not call getPage while isLoading === true");
        }
        this.getResult(response, paging);
    };

    public getResponse = () => {
        const { dimensions, filters = [], sortBy = [], autoLoadFirstPage = true } = this.props;
        const execution = getExecutionFromDimensions(dimensions, filters, sortBy);
        const responsePromise = this.props.sdk.execution.getExecutionResponse(
            this.props.projectId,
            execution,
        );
        this.setState({
            result: null,
            response: null,
            isLoading: true,
            error: null,
            responsePromise,
        });
            responsePromise.then((response) => {
                if (responsePromise !== this.state.responsePromise || this.hasUnmounted) {
                    // tslint:disable-next-line:no-console
                    console.warn("Discarding outdated response promise", responsePromise);
                    return;
                }
                if (autoLoadFirstPage) {
                    this.setState({ response, responsePromise: null });
                    this.getResult(response, this.getInitialPaging());
                } else {
                    this.setState({ response, isLoading: false, responsePromise: null });
                }
            }, (error) => {
                if (responsePromise !== this.state.responsePromise || this.hasUnmounted) {
                    // tslint:disable-next-line:no-console
                    console.warn("Discarding outdated response promise", responsePromise);
                    return;
                }
                this.setState({ error: convertErrors(error), isLoading: false, responsePromise: null });
            });
    };

    public getResult = (response: Execution.IExecutionResponse, paging: IPaging) => {
        const resultPromise = this.props.sdk.execution.getPartialExecutionResult(
            response.links.executionResult,
            paging.limit,
            paging.offset,
        );
        this.setState({ isLoading: true, result: null, error: null, resultPromise });
        resultPromise.then((result) => {
            if (resultPromise !== this.state.resultPromise || this.hasUnmounted) {
                // tslint:disable-next-line:no-console
                console.warn("Discarding outdated result promise", resultPromise);
                return;
            }
            this.setState({ result, isLoading: false, resultPromise: null });
        }, (error) => {
            if (resultPromise !== this.state.resultPromise || this.hasUnmounted) {
                // tslint:disable-next-line:no-console
                console.warn("Discarding outdated result promise", resultPromise);
                return;
            }
            this.setState({ isLoading: false, error: convertErrors(error), resultPromise: null });
        });
    };

    public getInitialPaging = () => {
        const { initialPaging, dimensions } = this.props;
        if (initialPaging) {
            return initialPaging;
        }
        const defaultDimensionOffset = 0;
        const defaultDimensionItemLimit = 100;
        const paging = {
            offset: dimensions.map(() => defaultDimensionOffset),
            limit: dimensions.map(() => defaultDimensionItemLimit),
        };
        return paging;
    };

    public render() {
        const { isLoading, result, response, error } = this.state;
        const childrenProps: IBucketExecutorChildrenProps = {
            isLoading,
            result,
            response,
            error,
            getPage: this.getPage
        };
        // if (this.fingerprintMatches(this.props)) {
            return this.props.children(childrenProps);
        // }
        // return null;
    }
}
