/*!
 * @license
 * Copyright 2016 Alfresco Software, Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
    Component,
    OnChanges,
    SimpleChange,
    SimpleChanges,
    Input,
    Output,
    EventEmitter,
    ElementRef,
    TemplateRef,
    AfterContentInit,
    ContentChild,
    Optional
} from '@angular/core';
import { ObjectDataRow, DataTableAdapter, DataRow, DataColumn, DataSorting, DataRowEvent, ObjectDataTableAdapter } from '../../data/index';
import { DataCellEvent } from './data-cell.event';
import { DataRowActionEvent } from './data-row-action.event';
import { DataColumnListComponent } from 'ng2-alfresco-core';
import { MdCheckboxChange } from '@angular/material';

declare var componentHandler;

@Component({
    selector: 'alfresco-datatable',
    styleUrls: ['./datatable.component.css'],
    templateUrl: './datatable.component.html'
})
export class DataTableComponent implements AfterContentInit, OnChanges {

    @ContentChild(DataColumnListComponent) columnList: DataColumnListComponent;

    @Input()
    data: DataTableAdapter;

    @Input()
    rows: any[] = [];

    @Input()
    selectionMode: string = 'single'; // none|single|multiple

    @Input()
    multiselect: boolean = false;

    @Input()
    actions: boolean = false;

    @Input()
    actionsPosition: string = 'right'; // left|right

    @Input()
    fallbackThumbnail: string;

    @Input()
    contextMenu: boolean = false;

    @Input()
    allowDropFiles: boolean = false;

    @Input()
    rowStyle: string;

    @Input()
    rowStyleClass: string;

    @Output()
    rowClick: EventEmitter<DataRowEvent> = new EventEmitter<DataRowEvent>();

    @Output()
    rowDblClick: EventEmitter<DataRowEvent> = new EventEmitter<DataRowEvent>();

    @Output()
    showRowContextMenu: EventEmitter<DataCellEvent> = new EventEmitter<DataCellEvent>();

    @Output()
    showRowActionsMenu: EventEmitter<DataCellEvent> = new EventEmitter<DataCellEvent>();

    @Output()
    executeRowAction: EventEmitter<DataRowActionEvent> = new EventEmitter<DataRowActionEvent>();

    noContentTemplate: TemplateRef<any>;
    isSelectAllChecked: boolean = false;

    constructor(@Optional() private el: ElementRef) {
    }

    ngAfterContentInit() {
        this.loadTable();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (this.isPropertyChanged(changes['data'])) {
            this.loadTable();
            return;
        }

        if (this.isPropertyChanged(changes['rows'])) {
            if (this.data) {
                this.data.setRows(this.convertToRowsData(changes['rows'].currentValue));
            }
            return;
        }

        if (changes.selectionMode && !changes.selectionMode.isFirstChange()) {
            this.resetSelection();
        }
    }

    isPropertyChanged(property: SimpleChange): boolean {
        return property && property.currentValue ? true : false;
    }

    convertToRowsData(rows: any []): ObjectDataRow[] {
        return rows.map(row => new ObjectDataRow(row));
    }

    loadTable() {
        let schema: DataColumn[] = [];

        if (this.columnList && this.columnList.columns) {
            schema = this.columnList.columns.map(c => <DataColumn> c);
        }

        if (!this.data) {
            this.data = new ObjectDataTableAdapter(this.rows, schema);
        } else {
            this.setHtmlColumnConfigurationOnObjectAdapter(schema);
        }

        // workaround for MDL issues with dynamic components
        if (componentHandler) {
            componentHandler.upgradeAllRegistered();
        }
    }

    private setHtmlColumnConfigurationOnObjectAdapter(schema: DataColumn[]) {
        if (schema && schema.length > 0) {
            this.data.setColumns(schema);
        }
    }

    onRowClick(row: DataRow, e: MouseEvent) {
        if (e) {
            e.preventDefault();
        }

        if (row) {
            if (this.data) {
                const newValue = !row.isSelected;
                const rows = this.data.getRows();

                if (this.isSingleSelectionMode()) {
                    rows.forEach(r => r.isSelected = false);
                    row.isSelected = newValue;
                }

                if (this.isMultiSelectionMode()) {
                    const modifier = e.metaKey || e.ctrlKey;
                    if (!modifier) {
                        rows.forEach(r => r.isSelected = false);
                    }
                    row.isSelected = newValue;
                }
            }

            let event = new DataRowEvent(row, e, this);
            this.rowClick.emit(event);

            if (!event.defaultPrevented && this.el.nativeElement) {
                this.el.nativeElement.dispatchEvent(
                    new CustomEvent('row-click', {
                        detail: event,
                        bubbles: true
                    })
                );
            }
        }
    }

    resetSelection(): void {
        if (this.data) {
            const rows = this.data.getRows();
            if (rows && rows.length > 0) {
                rows.forEach(r => r.isSelected = false);
            }
        }
    }

    onRowDblClick(row: DataRow, e?: Event) {
        if (e) {
            e.preventDefault();
        }

        let event = new DataRowEvent(row, e, this);
        this.rowDblClick.emit(event);

        if (!event.defaultPrevented && this.el.nativeElement) {
            this.el.nativeElement.dispatchEvent(
                new CustomEvent('row-dblclick', {
                    detail: event,
                    bubbles: true
                })
            );
        }
    }

    onColumnHeaderClick(column: DataColumn) {
        if (column && column.sortable) {
            let current = this.data.getSorting();
            let newDirection = 'asc';
            if (current && column.key === current.key) {
                newDirection = current.direction === 'asc' ? 'desc' : 'asc';
            }
            this.data.setSorting(new DataSorting(column.key, newDirection));
        }
    }

    onSelectAllClick(e: MdCheckboxChange) {
        this.isSelectAllChecked = e.checked;

        if (this.multiselect) {
            let rows = this.data.getRows();
            if (rows && rows.length > 0) {
                for (let i = 0; i < rows.length; i++) {
                    rows[i].isSelected = e.checked;
                }
            }
        }
    }

    onImageLoadingError(event: Event) {
        if (event && this.fallbackThumbnail) {
            let element = <any> event.target;
            element.src = this.fallbackThumbnail;
        }
    }

    isIconValue(row: DataRow, col: DataColumn): boolean {
        if (row && col) {
            let value = row.getValue(col.key);
            return value && value.startsWith('material-icons://');
        }
        return false;
    }

    asIconValue(row: DataRow, col: DataColumn): string {
        if (this.isIconValue(row, col)) {
            let value = row.getValue(col.key) || '';
            return value.replace('material-icons://', '');
        }
        return null;
    }

    iconAltTextKey(value: string): string {
        return 'ICONS.' + value.substring(value.lastIndexOf('/') + 1).replace(/\.[a-z]+/, '');
    }

    isColumnSorted(col: DataColumn, direction: string): boolean {
        if (col && direction) {
            let sorting = this.data.getSorting();
            return sorting && sorting.key === col.key && sorting.direction === direction;
        }
        return false;
    }

    getContextMenuActions(row: DataRow, col: DataColumn): any[] {
        let event = new DataCellEvent(row, col, []);
        this.showRowContextMenu.emit(event);
        return event.value.actions;
    }

    getRowActions(row: DataRow, col: DataColumn): any[] {
        let event = new DataCellEvent(row, col, []);
        this.showRowActionsMenu.emit(event);

        return this.checkPermissions(row, event.value.actions);
    }

    checkPermissions(row: DataRow, actions: any[]) {
        let actionsPermission = [];
        actions.forEach((action) => {
            actionsPermission.push(this.checkPermission(row, action));
        });
        return actionsPermission;
    }

    checkPermission(row: DataRow, action) {
        if (action.permission) {
            if (this.hasPermissions(row)) {
                let permissions = row.getValue('allowableOperations');
                let findPermission = permissions.find(permission => permission === action.permission);
                if (!findPermission && action.disableWithNoPermission === true) {
                    action.disabled = true;
                }
            }
        }
        return action;
    }

    private hasPermissions(row: DataRow): boolean {
        return row.getValue('allowableOperations') ? true : false;
    }

    onExecuteRowAction(row: DataRow, action: any) {
        if (action.disabled || action.disabled) {
            event.stopPropagation();
        } else {
            this.executeRowAction.emit(new DataRowActionEvent(row, action));
        }
    }

    rowAllowsDrop(row: DataRow): boolean {
        return row.isDropTarget === true;
    }

    hasSelectionMode(): boolean {
        return this.isSingleSelectionMode() || this.isMultiSelectionMode();
    }

    isSingleSelectionMode(): boolean {
        return this.selectionMode && this.selectionMode.toLowerCase() === 'single';
    }

    isMultiSelectionMode(): boolean {
        return this.selectionMode && this.selectionMode.toLowerCase() === 'multiple';
    }
}
