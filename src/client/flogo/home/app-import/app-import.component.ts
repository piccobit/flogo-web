import { Component, EventEmitter, Input, OnChanges, Output, ViewChild } from '@angular/core';
import { ModalComponent } from 'ng2-bs3-modal/ng2-bs3-modal';
import { ImportErrorFormatterService } from '../core/import-error-formatter.service';
import {ValidationDetails} from '@flogo/core/interfaces/backend';


@Component({
  selector: 'flogo-home-app-import',
  templateUrl: 'app-import.component.html',
  styleUrls: ['app-import.component.less']
})
export class FlogoAppImportComponent implements OnChanges {

  @ViewChild('errorModal') modal: ModalComponent;

  @Input() importValidationErrors: any;
  @Output() modalClose: EventEmitter<boolean> = new EventEmitter<boolean>();

  errorDetails: ValidationDetails[];

  constructor(public errorFormatter: ImportErrorFormatterService) {
    this.errorDetails = [];
  }

  ngOnChanges(changes: any) {
    this.openModal();
    this.errorDetails = this.importValidationErrors[0].meta.details.filter(d => d.keyword !== 'if');
  }

  openModal() {
    this.modal.open();
  }

  onModalCloseOrDismiss() {
    this.modalClose.emit(false);
  }


  closeModal() {
    this.modal.close();
    this.onModalCloseOrDismiss();
  }
}
