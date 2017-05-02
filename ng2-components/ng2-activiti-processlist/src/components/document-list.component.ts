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
    Component, OnInit, Input, ViewChild, ContentChild, AfterContentInit
} from '@angular/core';
import { AlfrescoTranslationService, DataColumnListComponent } from 'ng2-alfresco-core';
import { DataTableComponent, ObjectDataTableAdapter, DataColumn } from 'ng2-alfresco-datatable';

declare var module: any;

@Component({
    moduleId: module.id,
    selector: 'document-list',
    styleUrls: ['./document-list.component.css'],
    templateUrl: './document-list.component.html'
})
export class DocumentListComponent implements OnInit, AfterContentInit {

    @ContentChild(DataColumnListComponent) columnList: DataColumnListComponent;

    @Input()
    contentActions: boolean = false;

    @Input()
    rows: any[];

    @Input()
    contentActionsPosition: string = 'right'; // left|right

    @Input()
    contextMenuActions: boolean = false;

    @ViewChild(DataTableComponent)
    dataTable: DataTableComponent;

    @Input()
    thumbnails: boolean = false;

    data: any;

    actions: any[] = [];

    constructor(private translateService: AlfrescoTranslationService) {
    }

    ngOnInit() {
    }

    ngAfterContentInit() {
        this.setupSchema();
    }

    setupSchema(): void {
        let schema: DataColumn[] = [];

        if (this.columnList && this.columnList.columns && this.columnList.columns.length > 0) {
            schema = this.columnList.columns.map(c => <DataColumn> c);
        }

        this.data = new ObjectDataTableAdapter(this.rows, schema);
        this.data.thumbnails = this.thumbnails;
    }

    onShowRowActionsMenu(event: any) {
        let args = event.value;
        args.actions = [{icon: 'icon', title: 'My title', target: 'document'}];
    }

}
