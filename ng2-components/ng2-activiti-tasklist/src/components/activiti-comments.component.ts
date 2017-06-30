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

import { Component, Input, Output, ViewChild, OnChanges, SimpleChanges, EventEmitter } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AlfrescoTranslationService } from 'ng2-alfresco-core';
import { ActivitiTaskListService } from '../services/activiti-tasklist.service';
import { ActivitiPeopleService } from '../services/activiti-people.service';
import { Comment } from '../models/comment.model';
import { User } from '../models/user.model';
import { Observer, Observable } from 'rxjs/Rx';

declare let dialogPolyfill: any;

@Component({
    selector: 'activiti-comments',
    templateUrl: './activiti-comments.component.html',
    styleUrls: ['./activiti-comments.component.css'],
    providers: [ActivitiTaskListService]
})
export class ActivitiComments implements OnChanges {

    @Input()
    taskId: string;

    @Input()
    readOnly: boolean = false;

    @Output()
    error: EventEmitter<any> = new EventEmitter<any>();

    comments: Comment [] = [];

    private commentObserver: Observer<Comment>;
    comment$: Observable<Comment>;

    message: string;

    private profilePictures: ProfilePicture[];
    private transactionOn: boolean;

    /**
     * Constructor
     * @param translate Translation service
     * @param activitiTaskList Task service
     */
    constructor(private translateService: AlfrescoTranslationService,
                private activitiTaskList: ActivitiTaskListService,
                private activitiPeopleService: ActivitiPeopleService,
                private datePipe: DatePipe) {

        if (translateService) {
            translateService.addTranslationFolder('ng2-activiti-tasklist', 'assets/ng2-activiti-tasklist');
        }

        this.comment$ = new Observable<Comment>(observer =>  this.commentObserver = observer).share();
        this.comment$.subscribe((comment: Comment) => {
            this.comments.push(comment);
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        let taskId = changes['taskId'];
        if (taskId) {
            if (taskId.currentValue) {
                this.getTaskComments(taskId.currentValue);
            } else {
                this.resetComments();
            }
        }
    }

    private getTaskComments(taskId: string) {
        this.resetComments();
        if (taskId) {
            this.activitiTaskList.getTaskComments(taskId).subscribe(
                (res: Comment[]) => {
                    res = res.sort((a: Comment, b: Comment) => {
                        let date1 = new Date(a.created);
                        let date2 = new Date(b.created);
                        return date1 > date2 ? -1 : date1 < date2 ? 1 : 0;
                    });

                    res.forEach((comment) => {
                        //this.getUserProfilePicture(comment.createdBy);
                        this.commentObserver.next(comment);
                    });
                },
                (err) => {
                    this.error.emit(err);
                }
            );
        }
    }

    private resetComments() {
        this.comments = [];
    }

    private add() {
        
        if(this.message && this.message.trim() && !this.transactionOn) {
            this.transactionOn = true;
            this.activitiTaskList.addTaskComment(this.taskId, this.message).subscribe(
                (res: Comment) => {
                    this.comments.unshift(res);
                    this.message = '';
                    this.transactionOn = false;
                },
                (err) => {
                    this.error.emit(err);
                    this.transactionOn = false;
                }
            );
        }
    }

    private clear() {
        this.message = '';
    }

    private getUserShortName(comment: Comment) {
        let shortName = '';
        if (comment && comment.createdBy) {
            if (comment.createdBy.firstName) {
                shortName = comment.createdBy.firstName[0];
            }
            if (comment.createdBy.lastName) {
                shortName += comment.createdBy.lastName[0];
            }
        }
        return shortName;
    }

    private getUserProfilePicture(user: User) {       
        if(user && user.id && !this.isProfilePictureLoaded(user.id)){
            this.createPictureEntry(new ProfilePicture(user.id, null));
            this.activitiPeopleService.getUserProfilePicture(user.id).subscribe(
                (res: any) => {
                    console.log(10);
                    console.log(res);
                    this.replaceProfilePicture(new ProfilePicture(user.id, res));
                },
                (err) => {
                    this.error.emit(err);
                }
            );
        }
    }

    private createPictureEntry(profilePicture: ProfilePicture) {
        if(this.profilePictures) {
            this.profilePictures.push(profilePicture);
        } else {
            this.profilePictures = [profilePicture];
        }
    }

    private replaceProfilePicture(profilePicture: ProfilePicture) {
        console.log(profilePicture);
        if(profilePicture && profilePicture.image){
            let aProfilePicture = this.profilePictures.find(ProfilePicture => ProfilePicture.userId === profilePicture.userId && profilePicture.image === null);
            if(aProfilePicture) {
                aProfilePicture.image = profilePicture.image;
            }
        }
    }

    private findProfilePicture(user: User) {
        if(this.profilePictures && user) {
            let obj = this.profilePictures.find(ProfilePicture => ProfilePicture.userId === user.id);
            return obj ? obj.image : null;
        }
    }

    isProfilePictureLoaded(userId: number) {
        if(this.profilePictures && this.profilePictures.find(ProfilePicture => ProfilePicture.userId === userId) ) {
            return true;
        }
        return false;
    }

    private transformDate(aDate: string) {
        let formattedDate: string;
        let givenDate = Number.parseInt(this.datePipe.transform(aDate, 'yMMdd'));
        let today = Number.parseInt(this.datePipe.transform(Date.now(), 'yMMdd'));
        if( givenDate === today ){
            formattedDate = 'Today, ' + this.datePipe.transform(aDate, 'hh:mm a');
        }
        else {
            let yesterday = Number.parseInt(this.datePipe.transform(Date.now() - 24*3600*1000, 'yMMdd'));
            if( givenDate === yesterday ){
                formattedDate = 'Yesterday, ' + this.datePipe.transform(aDate, 'hh:mm a');
            }
            else {
                formattedDate = this.datePipe.transform(aDate, 'MMM dd y, hh:mm a');
            }
        }
        return formattedDate;
    }

    private isReadOnly() {
        return this.readOnly;
    }
}

class ProfilePicture {
    userId: number;
    image: string;
    constructor(userId: number, image: string) {
        this.userId = userId;
        this.image = image;
    }
}
