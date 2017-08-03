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

import { Component, Input, OnChanges, ViewChild } from '@angular/core';
import { CardViewUserlistItemModel } from '../../models/card-view-userlistitem.model';
import { CardViewUpdateService } from '../../services/card-view-update.service';

@Component({
    selector: 'adf-card-view-userlistitem',
    templateUrl: './card-view-userlistitem.component.html',
    styleUrls: ['./card-view-userlistitem.component.scss']
})
export class CardViewUserlistItemComponent implements OnChanges {
    @Input()
    property: CardViewUserlistItemModel;

    @Input()
    editable: boolean;

    @ViewChild('editorInput')
    private editorInput: any;

    inEdit: boolean = false;
    editedValue: any;

    constructor(private cardViewUpdateService: CardViewUpdateService) {}

    ngOnChanges() {
        this.editedValue = this.property.value;
    }

    isEditble() {
        return this.editable && this.property.editable;
    }

    isClickable() {
        return this.property.clickable;
    }

    setEditMode(editStatus: boolean): void {
        this.inEdit = editStatus;
        setTimeout(() => {
            this.editorInput.nativeElement.click();
        }, 0);
    }

    reset(): void {
        this.editedValue = this.property.value;
        this.setEditMode(false);
    }

    update(): void {
        // this.cardViewUpdateService.update(this.property, { [this.property.key]: this.editedValue });
        this.setEditMode(false);
    }

    clicked(): void {
        this.cardViewUpdateService.clicked(this.property);
    }

    displayFn(user: any): string {
      return user ? ((user.firstName) ? user.firstName : '') + ' ' + ((user.lastName) ? user.lastName : '') : '';
   }
}
