import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CriacaoPcsComponent } from './criacao-pcs/criacao-pcs.component';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'criacao-pcs', component: CriacaoPcsComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
