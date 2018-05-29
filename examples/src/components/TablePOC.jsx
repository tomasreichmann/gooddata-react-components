// (C) 2007-2018 GoodData Corporation
/* eslint-disable react/jsx-closing-tag-location */
import React, { Component } from 'react';
import { findDOMNode } from 'react-dom';
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
        header.render = 'RowHeader';
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

const getFieldFromProps = ({ column, columnGroup }) => {
    console.log('getFieldFromProps column, columnGroup', column, columnGroup);
    if (column) {
        return column.colDef.field || column.colDef.showRowGroup || null;
    } else if (columnGroup) {
        return columnGroup.originalColumnGroup.colGroupDef.field || null;
    }
    return null;
};

class RowHeaderCore extends Component {
    static propTypes = {
        displayName: PropTypes.any.isRequired,
        column: PropTypes.object.isRequired
    };

    constructor(props) {
        super(props);
        this.state = {
            indicator: null
        };
    }

    render() {
        const {
            displayName,
            column,
            isDragging,
            connectDragSource,
            connectDropTarget,
            isOver,
            canDrop
        } = this.props;

        if (!column.colDef.showRowGroup) {
            return <span>{displayName}</span>;
        }

        const { indicator } = this.state;
        const headerStyle = {
            width: '100%',
            position: 'relative'
        };
        const field = column.colDef.showRowGroup;

        const getIndicatorStyle = position => ({
            width: 0,
            height: '100%',
            position: 'absolute',
            top: 0,
            marginLeft: position === 'after' ? -2 : 0,
            borderLeft: `2px dashed ${isOver ? GD_BLUE : GD_GREY}`,
            [position === 'after' ? 'right' : 'left']: COLUMN_GUTTER * (-1 / 2)
        });
        const getIndicator = position => <div style={getIndicatorStyle(position)} />;

        return connectDragSource(connectDropTarget((<div style={headerStyle}>
            {isOver && indicator ? getIndicator(indicator) : null}
            {displayName}
        </div>)));
    }
}

const RowHeaderWithDrop = DropTarget(
    DRAG_TYPE_COLUMN,
    {
        drop(props) {
            console.log('drop props', props);
            return { field: getFieldFromProps(props) };
        },
        hover(props, monitor, component) {
            const dragField = monitor.getItem().field;
            const dropField = getFieldFromProps(props);
            if (
                // Ignore dropping on itself
                dragField !== dropField
                // Only allowed dropzones
                && monitor.canDrop()
            ) {
                // Determine rectangle on screen
                const hoverBoundingRect = findDOMNode(component).getBoundingClientRect();

                // Get horizontal middle
                const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;

                // Determine mouse position
                const clientOffset = monitor.getClientOffset();

                // Get pixels to the left
                const hoverClientX = clientOffset.x - hoverBoundingRect.left;

                // TODO: Ignore dropping next to itself
                if (hoverClientX > hoverMiddleX) {
                    component.setState({ indicator: 'after' });
                } else {
                    component.setState({ indicator: 'before' });
                }
            }
        }
    },
    (connect, monitor) => {
        return {
            connectDropTarget: connect.dropTarget(),
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop()
        };
    }
)(RowHeaderCore);

const RowHeader = DragSource(
    DRAG_TYPE_COLUMN,
    {
        beginDrag(props) {
            console.log('beginDrag props', props);
            console.log('props.field', props.field);
            return {
                field: getFieldFromProps(props)
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
)(RowHeaderWithDrop);

class ColumnHeaderCore extends Component {
    static propTypes = {
        displayName: PropTypes.any.isRequired,
        column: PropTypes.object.isRequired
    };

    constructor(props) {
        super(props);
        this.state = {
            indicator: null
        };
    }

    render() {
        const {
            displayName,
            column,
            isDragging,
            connectDragSource,
            connectDropTarget,
            isOver,
            canDrop
        } = this.props;

        if (displayName === null) {
            return null;
        }

        const field = getFieldFromProps(this.props);

        if (field === null) {
            return <span>{displayName}</span>;
        }

        const { indicator } = this.state;
        const headerStyle = {
            width: '100%',
            position: 'relative'
        };
        console.log('this.props', this.props);
        // const field = column.colDef.showRowGroup;

        const getIndicatorStyle = position => ({
            height: 0,
            position: 'absolute',
            left: -COLUMN_GUTTER / 2,
            right: -COLUMN_GUTTER / 2,
            borderTop: `2px dashed ${isOver ? GD_BLUE : GD_GREY}`,
            [position === 'after' ? 'bottom' : 'top']: position === 'after' ? 1 : 0
        });
        const getIndicator = position => <div style={getIndicatorStyle(position)} />;
        return connectDragSource(connectDropTarget((<div style={headerStyle}>
            {isOver && indicator ? getIndicator(indicator) : null}
            {displayName}
        </div>)));
    }
}

const ColumnHeaderWithDrop = DropTarget(
    DRAG_TYPE_COLUMN,
    {
        drop(props) {
            console.log('drop props', props);
            return { field: getFieldFromProps(props) };
        },
        hover(props, monitor, component) {
            const dragField = monitor.getItem().field;
            const dropField = getFieldFromProps(props);
            if (
                // Ignore dropping on itself
                dragField !== dropField
                // Only allowed dropzones
                && monitor.canDrop()
            ) {
                // Determine rectangle on screen
                const hoverBoundingRect = findDOMNode(component).getBoundingClientRect();

                // Get horizontal middle
                const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

                // Determine mouse position
                const clientOffset = monitor.getClientOffset();

                // Get pixels to the left
                const hoverClientY = clientOffset.y - hoverBoundingRect.top;

                // TODO: Ignore dropping next to itself
                if (hoverClientY > hoverMiddleY) {
                    console.log('top');
                    // show right indicator
                    component.setState({ indicator: 'after' });
                } else {
                    console.log('bottom');
                    // show left indicator
                    component.setState({ indicator: 'before' });
                }
            }
        }
    },
    (connect, monitor) => {
        return {
            connectDropTarget: connect.dropTarget(),
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop()
        };
    }
)(ColumnHeaderCore);

const ColumnHeader = DragSource(
    DRAG_TYPE_COLUMN,
    {
        beginDrag: (props) => {
            console.log('beginDrag props', props);
            console.log('props.field', props.field);
            return {
                field: getFieldFromProps(props)
            };
        },
        endDrag: (props, monitor) => {
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
)(ColumnHeaderWithDrop);

const CustomHeader = ({displayName}) => (<div>!!!{displayName}</div>);

// /gdc/md/PID/dataResult/execID
// executor3.res

export class TablePOC extends Component {
    // constructor(props) {
    //     super(props);
    // }

    renderAgGrid(executionDataResult) {
        const { columnDefs, rowData } = executionResponseToGrid(executionDataResult);

        const gridOptions = {
            frameworkComponents: {
                agColumnHeader: RowHeader,
                agColumnGroupHeader: ColumnHeader
            },
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
