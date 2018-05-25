// (C) 2007-2018 GoodData Corporation
/* eslint-disable react/jsx-closing-tag-location */
import React, { Component } from 'react';
// import PropTypes from 'prop-types';

import { Execute } from '@gooddata/react-components';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-enterprise';
import 'ag-grid/dist/styles/ag-grid.css';
import 'ag-grid/dist/styles/ag-theme-balham.css';

import {
    projectId
} from '../utils/fixtures';

import { afm, resultSpec } from '../utils/fixturesTablePOC';

// const CustomHeader = (props) => {
//     return (<div>
//         <div className="customHeaderLabel">{props.displayName}XXX</div>
//     </div>);
// };
// CustomHeader.propTypes = {
//     displayName: PropTypes.any.isRequired
// };

const unwrap = wrapped => (wrapped[Object.keys(wrapped)[0]]);

const identifyHeader = (header) => {
    return header.uri
        ? `a_${header.uri.split('elements?id=')[1]}`
        : `m_${header.order}`;
};

const headerToGrid = (header, fieldPrefix = '') => ({
    headerName: header.name,
    field: fieldPrefix + identifyHeader(header)
});

const FIELD_SEPARATOR = '|';

const getColumnHeaders = (
    headerDimension,
    attributeIndex = 0,
    attributeValueStart = 0,
    attributeValueEnd = undefined,
    fieldPrefix = ''
) => {
    const currentHeaders = headerDimension[attributeIndex];
    const lastIndex = attributeValueEnd !== undefined ? attributeValueEnd : currentHeaders.length - 1;
    const hierarchy = [];

    for (let index = attributeValueStart; index < lastIndex + 1; index += 1) {
        let headerCount = 0;
        const header = headerToGrid(unwrap(currentHeaders[index]), fieldPrefix);
        while (currentHeaders[index + 1] && header.field === identifyHeader(unwrap(currentHeaders[index + 1]))) {
            headerCount += 1;
            index += 1;
        }
        if (attributeIndex !== headerDimension.length - 1) {
            header.children = getColumnHeaders(
                headerDimension,
                attributeIndex + 1,
                index - headerCount,
                index,
                header.field + FIELD_SEPARATOR
            );
        }
        hierarchy.push(header);
    }

    return hierarchy;
};

const getRowHeaders = (rowDimensionHeaders) => {
    return rowDimensionHeaders.map((headerItemWrapped) => {
        const headerItem = unwrap(headerItemWrapped);
        return {
            headerName: headerItem.name,
            field: `a_${headerItem.uri.split('/obj/')[1]}`,
            rowGroup: true,
            hide: true
        };
    });
};

const getFields = (dataHeaders) => {
    return dataHeaders[0].map((cell, cellIndex) => {
        const fieldList = dataHeaders.map(
            header => identifyHeader(unwrap(header[cellIndex]))
        );
        return fieldList.join(FIELD_SEPARATOR);
    });
};

const getRow = (cellData, rowIndex, columnFields, rowHeaders, rowHeaderData) => {
    const row = {};
    cellData.forEach((cell, cellIndex) => {
        rowHeaders.forEach((rowHeader, rowHeaderIndex) => {
            row[rowHeader.field] = unwrap(rowHeaderData[rowHeaderIndex][rowIndex]).name;
        });
        row[columnFields[cellIndex]] = cell;
    });
    return row;
};

const executionResponseToGrid = (executionDataResult) => {
    const dimensions = executionDataResult.executionResponse.dimensions; // eslint-disable-line prefer-destructuring
    const measureData = executionDataResult.executionResult.data; // eslint-disable-line prefer-destructuring
    const headers = executionDataResult.executionResult.headerItems; // eslint-disable-line prefer-destructuring

    const columnHeaders = [{
        headerName: dimensions[1].headers
            .map((header) => {
                if (header.attributeHeader) {
                    return header.attributeHeader.name;
                }
                if (header.measureGroupHeader.items.length > 1) {
                    return 'measures';
                }
                return null;
            })
            .filter(item => item !== null)
            .join('/'),
        children: getColumnHeaders(headers[1])
    }];

    const rowHeaders = getRowHeaders(dimensions[0].headers);

    const columnDefs = [
        ...rowHeaders,
        ...columnHeaders
    ].map(columnDef => ({
        ...columnDef
    }));

    const columnFields = getFields(headers[1]);
    const rowData = measureData.map(
        (dataRow, dataRowIndex) => getRow(dataRow, dataRowIndex, columnFields, rowHeaders, headers[0])
    );

    return {
        columnDefs,
        rowData
    };
};

// /gdc/md/PID/dataResult/execID
// executor3.res

export class TablePOC extends Component {
    // constructor(props) {
    //     super(props);
    // }

    renderAgGrid(executionDataResult) {
        const { columnDefs, rowData } = executionResponseToGrid(executionDataResult);

        const gridOptions = {
            // frameworkComponents: { agColumnHeader: CustomHeader },
            // groupMultiAutoColumn: 2,
            // groupSuppressAutoColumn: true,
            // groupSuppressRow: true,
            columnDefs,
            rowData,
            // groupUseEntireRow: true,
            // enableRowGroup: true,
            // showToolPanel: true,

            groupDefaultExpanded: -1,
            groupHideOpenParents: true,

            autoGroupColumnDef: {
                cellRenderer: 'simpleCellRenderer'
                // cellRendererParams: {
                //     suppressCount: true,
                //     suppressDoubleClickExpand: true
                // }
            },

            toolbox: true,
            animateRows: true,
            enableRangeSelection: true,
            enableSorting: true,
            enableFilter: true
        };

        return (
            <div
                className="ag-theme-balham"
                style={
                    {
                        height: '500px'
                    }
                }
            >
                <AgGridReact
                    {...gridOptions}
                    columnDefs={columnDefs}
                    rowData={rowData}
                />
            </div>
        );
    }

    render() {
        return (<Execute projectId={projectId} afm={afm} resultSpec={resultSpec} >{
            ({ isLoading, result, error }) => {
                if (isLoading) {
                    return (<div>loading ...</div>);
                }
                if (result) {
                    return this.renderAgGrid(result);
                }
                if (error) {
                    return (<pre>{JSON.stringify(error, null, 4)}</pre>);
                }
                return (<div>loading ...</div>);
            }
        }</Execute>);
    }
}

export default TablePOC;
