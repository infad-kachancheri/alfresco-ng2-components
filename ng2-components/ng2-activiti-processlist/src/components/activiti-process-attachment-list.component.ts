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

import { Component, OnChanges, Input, SimpleChanges } from '@angular/core';
import { AlfrescoTranslationService } from 'ng2-alfresco-core';
import { ActivitiProcessService } from './../services/activiti-process.service';

@Component({
    selector: 'activiti-process-attachment-list',
    styleUrls: ['./activiti-process-attachment-list.component.css'],
    templateUrl: './activiti-process-attachment-list.component.html',
    providers: [ActivitiProcessService]
})
export class ActivitiProcessAttachmentListComponent implements OnChanges {

    @Input()
    processInstanceId: string;

    attachments: any[] = [];

    constructor(private translateService: AlfrescoTranslationService,
                private processInstanceService: ActivitiProcessService) {

        if (translateService) {
            translateService.addTranslationFolder('ng2-activiti-processlist', 'node_modules/ng2-activiti-processlist/src');
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['processInstanceId'] && changes['processInstanceId'].currentValue) {
            this.loadAttachmentsByProcessInstanceId(this.processInstanceId);
        }
    }

    reset () {
        this.attachments = [];
    }

    private loadAttachmentsByProcessInstanceId(processInstanceId: string) {
        if (processInstanceId) {
            this.reset();
            this.processInstanceService.getRelatedContent(processInstanceId).subscribe(
                (res: any) => {
                    res.data.forEach(content => {
                        this.attachments.push({
                            id: content.id,
                            name: content.name,
                            created: content.created,
                            createdBy: content.createdBy.firstName + ' ' + content.createdBy.lastName
                        });
                    });

                });
        }
    }

    private deleteAttachmentById(contentId: string) {
        if (contentId) {
            this.attachments = this.attachments.filter(content => {
                return content.id !== contentId;
            });
        }
    }

    isEmpty(): boolean {
        return this.attachments && this.attachments.length === 0;
    }

    onShowRowActionsMenu(event: any) {
        let deleteAction = {
            title: 'Delete',
            name: 'delete'
        };
        let downloadAction = {
            title: 'Download',
            name: 'download'
        };
        event.value.actions = [
            deleteAction,
            downloadAction
        ];
    }

    onExecuteRowAction(event: any) {
        let args = event.value;
        let action = args.action;
        if (action.name === 'delete') {
            this.deleteAttachmentById(args.row.obj.id);
        }
    }
}
