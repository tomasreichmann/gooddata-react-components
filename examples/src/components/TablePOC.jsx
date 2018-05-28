// (C) 2007-2018 GoodData Corporation
/* eslint-disable react/jsx-closing-tag-location */
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Execute } from '@gooddata/react-components';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-enterprise';
import 'ag-grid/dist/styles/ag-grid.css';
import 'ag-grid/dist/styles/ag-theme-balham.css';

import { DragSource, DropTarget, DragDropContextProvider } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

import {
    projectId
} from '../utils/fixtures';

import { afm, resultSpec } from '../utils/fixturesTablePOC';

const DRAG_TYPE_COLUMN = 'DRAG_TYPE_COLUMN';
const COLUMN_GUTTER = 24;
const GD_BLUE = '#14b2e2';
const GD_GREY = '#BDC3C7';

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

const RowDropZoneCore = ({
    connectDropTarget,
    isOver,
    canDrop,
    position = 'right'
}) => {
    const style = {
        display: canDrop ? 'block' : 'none',
        position: 'absolute',
        top: 0,
        height: '100%',
        width: COLUMN_GUTTER,
        zIndex: 100,
        transform: `translate(${position === 'right' ? '50%' : '-50%'}, 0)`,
        [position === 'right' ? 'right' : 'left']: COLUMN_GUTTER * (-1 / 2)
    };
    const indicatorStyle = {
        width: 0,
        height: '100%',
        position: 'absolute',
        left: '50%',
        marginLeft: position === 'right' ? -1 : 0,
        borderLeft: `2px dashed ${isOver ? GD_BLUE : GD_GREY}`
    };

    return connectDropTarget(<div style={style} >
        <div style={indicatorStyle} />
    </div>);
};
RowDropZoneCore.propTypes = {
    connectDropTarget: PropTypes.any.isRequired,
    isOver: PropTypes.bool.isRequired,
    canDrop: PropTypes.bool.isRequired
};

const RowDropZone = DropTarget(
    DRAG_TYPE_COLUMN,
    {
        drop(props) {
            console.log('drop props', props);
            return { field: props.column.colDef.field || props.column.colDef.showRowGroup };
        }
    },
    (connect, monitor) => ({
        connectDropTarget: connect.dropTarget(),
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop()
    })
)(RowDropZoneCore);

const isFirstRowColumn = ({ agGridReact, column }) => {
    return column.colDef.showRowGroup === agGridReact.gridOptions.columnDefs[0].field;
};

class DragZoneCore extends Component {
    static propTypes = {
        displayName: PropTypes.any.isRequired,
        isDragging: PropTypes.bool.isRequired,
        connectDragSource: PropTypes.any.isRequired,
        // connectDragPreview: PropTypes.any.isRequired
    };

    // componentDidMount() {
    //     const { connectDragPreview, displayName } = this.props;
    //     connectDragPreview(<span>{displayName}</span>);
    // }

    render() {
        const { isDragging, connectDragSource, displayName } = this.props;
        console.log('DragZoneCore props', this.props);
        const style = {
            opacity: isDragging ? 0.5 : 1,
            width: '100%'
        };
        return connectDragSource(<div style={style}>{displayName}</div>);
    }
}

const DragZone = DragSource(
    DRAG_TYPE_COLUMN,
    {
        beginDrag(props) {
            console.log('beginDrag props', props);
            console.log('props.field', props.field);
            return {
                field: props.field
            };
        },
        endDrag(props, monitor) {
            const item = monitor.getItem();
            const dropResult = monitor.getDropResult();
            console.log('endDrag dropResult', dropResult);
            console.log('endDrag item', item);
            // if (dropResult) {
            // }
        }
    },
    (connect, monitor) => ({
        connectDragSource: connect.dragSource(),
        connectDragPreview: connect.dragPreview(),
        isDragging: monitor.isDragging()
    })
)(DragZoneCore);

class RowHeader extends Component {
    static propTypes = {
        displayName: PropTypes.any.isRequired,
        column: PropTypes.object.isRequired
    };

    render() {
        const { displayName, column } = this.props;
        const style = {
            width: '100%',
            position: 'relative'
        };
        const field = column.colDef.showRowGroup;
        console.log('RowHeader this.props', this.props);
        return (<div style={style}>
            {isFirstRowColumn(this.props) ? <RowDropZone column={column} position="left" /> : null}
            <DragZone displayName={displayName} field={field} />
            <RowDropZone column={column} />
        </div>);
    }
}

// /gdc/md/PID/dataResult/execID
// executor3.res

export class TablePOC extends Component {
    // constructor(props) {
    //     super(props);
    // }

    renderAgGrid(executionDataResult) {
        const { columnDefs, rowData } = executionResponseToGrid(executionDataResult);

        const gridOptions = {
            frameworkComponents: { agColumnHeader: RowHeader },
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
            suppressMovableColumns: true,

            autoGroupColumnDef: {
                cellRenderer: 'agColumnHeader'
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
                <DragDropContextProvider backend={HTML5Backend}>
                    <AgGridReact
                        {...gridOptions}
                        columnDefs={columnDefs}
                        rowData={rowData}
                    />
                </DragDropContextProvider>
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
