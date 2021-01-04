import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FridgesComponent } from './pages/fridges/fridges.component';

const routes: Routes = [
  { path: '', component: FridgesComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
