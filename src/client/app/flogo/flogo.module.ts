import { NgModule }       from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Ng2Bs3ModalModule } from 'ng2-bs3-modal/ng2-bs3-modal';

import { CommonModule as FlogoCommonModule } from '../../common/common.module';

import { FlogoAppsModule } from '../flogo.apps/flogo.apps.module';
import { FlowsModule as FlogoFlowsModule } from '../flogo.flows/flogo.flows.module';
import { FlogoFlowsDetailModule } from '../flogo.flows.detail/flogo.flows.detail.module';
import { ConfigModule as FlogoConfigModule } from '../flogo.config/flogo.config.module';
import { InstructionsModule as FlogoInstructionsModule } from '../flogo.instructions/flogo.instructions.module';
import { FooterModule as FlogoFooterModule } from '../flogo.footer/flogo.footer.module';

import { FlogoAppComponent }   from './components/flogo.component';
import { FlogoNavbarComponent }   from './components/navbar.component';

import {routing, appRoutingProviders} from "./flogo.routing";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    Ng2Bs3ModalModule,
    FlogoCommonModule,
    FlogoAppsModule,
    FlogoFlowsModule,
    FlogoFlowsDetailModule,
    FlogoConfigModule,
    FlogoInstructionsModule,
    FlogoFooterModule,
    routing
  ],
  declarations: [
    FlogoAppComponent,
    FlogoNavbarComponent
  ],
  bootstrap: [FlogoAppComponent],
  providers: [appRoutingProviders]
})
export class FlogoModule {}