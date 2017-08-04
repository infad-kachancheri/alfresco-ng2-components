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

import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import {
    AlfrescoTranslationService, CardViewDateItemModel, CardViewItem,
    CardViewMapItemModel, CardViewTextItemModel, CardViewUpdateService,
    ClickNotification, LogService } from 'ng2-alfresco-core';
import { Observable, Observer } from 'rxjs/Rx';
import { TaskDetailsModel } from '../models/task-details.model';
import { User } from '../models/user.model';
import { PeopleService } from '../services/people.service';
import { TaskListService } from './../services/tasklist.service';

@Component({
    selector: 'adf-task-header, activiti-task-header',
    templateUrl: './task-header.component.html',
    styleUrls: ['./task-header.component.scss', './task-header.component.css']
})
export class TaskHeaderComponent implements OnChanges, OnInit {

    @Input()
    formName: string = null;

    @Input()
    taskDetails: TaskDetailsModel;

    @Output()
    claim: EventEmitter<any> = new EventEmitter<any>();

    @Output()
    assign: EventEmitter<void> = new EventEmitter<void>();

    properties: CardViewItem [];
    inEdit: boolean = false;
    showAssignee: boolean = false;

    private peopleSearchObserver: Observer<User[]>;
    peopleSearch$: Observable<User[]>;

    constructor(private translateService: AlfrescoTranslationService,
                private activitiTaskService: TaskListService,
                private cardViewUpdateService: CardViewUpdateService,
                private peopleService: PeopleService,
                private logService: LogService) {
        if (translateService) {
            translateService.addTranslationFolder('ng2-activiti-tasklist', 'assets/ng2-activiti-tasklist');
        }
        this.peopleSearch$ = new Observable<User[]>(observer => this.peopleSearchObserver = observer).share();
    }

    ngOnInit() {
        this.cardViewUpdateService.itemClicked$.subscribe(this.clickTaskDetails.bind(this));
    }

    ngOnChanges(changes: SimpleChanges) {
        console.log('change van:', changes, this.taskDetails);
        this.showAssignee = false;
        this.refreshData();
    }

    refreshData() {
        if (this.taskDetails) {
            let valueMap = new Map([[this.taskDetails.processInstanceId, this.taskDetails.processDefinitionName]]);
            this.properties = [
                new CardViewTextItemModel({ label: 'Assignee', value: this.taskDetails.getFullName(), key: 'assignee', default: 'No assignee', clickable: true } ),
                new CardViewTextItemModel({ label: 'Status', value: this.getTaskStatus(), key: 'status' }),
                new CardViewDateItemModel({ label: 'Due Date', value: this.taskDetails.dueDate, key: 'dueDate', default: 'No date', editable: true }),
                new CardViewTextItemModel({ label: 'Category', value: this.taskDetails.category, key: 'category', default: 'No category' }),
                new CardViewMapItemModel({ label: 'Parent name', value: valueMap, key: 'parentName', default: 'No parent name', clickable: true  }),
                new CardViewTextItemModel({ label: 'Created By', value: this.taskDetails.getFullName(), key: 'created-by', default: 'No assignee' }),
                new CardViewDateItemModel({ label: 'Created', value: this.taskDetails.created, key: 'created' }),
                new CardViewTextItemModel({ label: 'Id', value: this.taskDetails.id, key: 'id' }),
                new CardViewTextItemModel({
                    label: 'Description',
                    value: this.taskDetails.description,
                    key: 'description',
                    default: 'No description',
                    multiline: true,
                    editable: true
                }),
                new CardViewTextItemModel({ label: 'Form name', value: this.formName, key: 'formName', default: 'No form' })
            ];
        }
    }

    public hasAssignee(): boolean {
        return (this.taskDetails && this.taskDetails.assignee) ? true : false;
    }

    isAssignedToMe(): boolean {
        return this.taskDetails.assignee ? true : false;
    }

    getTaskStatus(): string {
        return this.isCompleted() ? 'Completed' : 'Running';
    }

    claimTask(taskId: string) {
        this.activitiTaskService.claimTask(taskId).subscribe(
            (res: any) => {
                this.logService.info('Task claimed');
                this.claim.emit(taskId);
            });
    }

    isCompleted() {
        return !!this.taskDetails.endDate;
    }

    private clickTaskDetails(clickNotification: ClickNotification) {
        if (clickNotification.target.key === 'assignee') {
            this.showAssignee = true;
        }
    }

    searchUser(searchedWord: string) {
        this.peopleService.getWorkflowUsers(null, searchedWord)
            .subscribe((users) => {
                users = users.filter((user) => user.id !== this.taskDetails.assignee.id);
                this.peopleSearchObserver.next(users);
            },         error => this.logService.error('Could not load users'));
    }

    onCloseSearch() {
        this.showAssignee = false;
        console.log(this.taskDetails.assignee);
    }

    getCardViewClass() {
        if (this.showAssignee) {
            return 'edit-view';
        } else {
            return 'default-view';
        }
    }

    assignTaskToUser(selectedUser: User) {
        this.activitiTaskService.assignTask(this.taskDetails.id, selectedUser).subscribe(
            (res: any) => {
                this.logService.info('Task Assigned to ' + selectedUser.email);
                this.assign.emit();
            });
        this.showAssignee = false;
    }
}
