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

import { Component, OnInit, Input} from '@angular/core';
import { AlfrescoTranslationService } from 'ng2-alfresco-core';
import { ActivitiProcessService } from './../services/activiti-process.service';

@Component({
    selector: 'activiti-process-attachment-list',
    styleUrls: ['./activiti-process-attachment-list.component.css'],
    templateUrl: './activiti-process-attachment-list.component.html',
    providers: [ActivitiProcessService]
})
export class ActivitiProcessAttachmentListComponent implements OnInit {

    @Input()
    processInstanceId: string;

    attachments: any[] = [];

    constructor(private translateService: AlfrescoTranslationService,
                private activitiProcessService: ActivitiProcessService) {

        if (translateService) {
            translateService.addTranslationFolder('ng2-activiti-processlist', 'node_modules/ng2-activiti-processlist/src');
        }
    }

    ngOnInit() {
        this.loadAttachmentsByTaskId(this.processInstanceId);
    }

    private loadAttachmentsByTaskId(processInstanceId: string) {
        if (processInstanceId) {
            this.activitiProcessService.getRelatedContent(processInstanceId).subscribe(
                (res: any) => {
                    res.data.forEach(content => {
                        this.attachments.push({
                            name: content.name,
                            created: content.created,
                            createdBy: content.createdBy.firstName + ' ' + content.createdBy.lastName
                        });
                    });

                });
        }
    }

    isEmpty(): boolean {
        return this.attachments && this.attachments.length === 0;
    }

}
