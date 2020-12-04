import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CidadeComponent } from './cidade/cidade.component';
import { CriacaoPcsComponent } from './criacao-pcs/criacao-pcs.component';
import { FeedComponent } from './feed/feed.component';
import { HomeComponent } from './home/home.component';
import { MeuPersonagemComponent } from './meu-personagem/meu-personagem.component';
import { NpcsComponent } from './npcs/npcs.component';
import { PersonagensComponent } from './personagens/personagens.component';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'criacao-pcs', component: CriacaoPcsComponent },
  { path: 'npcs', component: NpcsComponent },
  { path: 'personagens', component: PersonagensComponent },
  { path: 'cidade', component: CidadeComponent },
  { path: 'feed', component: FeedComponent },
  { path: 'meu-personagem', component: MeuPersonagemComponent },
  {path: '**', redirectTo: '/home'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
