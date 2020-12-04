import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { environment } from 'src/environments/environment';
import { AngularFireModule } from '@angular/fire';
import { AngularFireDatabaseModule } from '@angular/fire/database';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { MenuBarComponent } from './menu-bar/menu-bar.component';
import { CriacaoPcsComponent } from './criacao-pcs/criacao-pcs.component';
import { CidadeComponent } from './cidade/cidade.component';
import { NpcsComponent } from './npcs/npcs.component';
import { PersonagensComponent } from './personagens/personagens.component';
import { FeedComponent } from './feed/feed.component';
import { MeuPersonagemComponent } from './meu-personagem/meu-personagem.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    MenuBarComponent,
    CriacaoPcsComponent,
    CidadeComponent,
    NpcsComponent,
    PersonagensComponent,
    FeedComponent,
    MeuPersonagemComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,

    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFireDatabaseModule,
    AngularFirestoreModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
