import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { NgxGoogleAnalyticsModule } from 'ngx-google-analytics';

import { AppComponent } from './app.component';
import { AboutMeComponent } from './components/home/about-me/about-me.component';
import { BannerComponent } from './components/home/banner/banner.component';
import { ContactComponent } from './components/home/contact/contact.component';
import { ExperienceComponent } from './components/home/experience/experience.component';
import { ProjectsComponent } from './components/home/projects/projects.component';
import { ResearchNotesComponent } from './components/home/research-notes/research-notes.component';

@NgModule({
  declarations: [
    AppComponent,
    AboutMeComponent,
    BannerComponent,
    ExperienceComponent,
    ProjectsComponent,
    ResearchNotesComponent,
    ContactComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    NgxGoogleAnalyticsModule.forRoot('G-SFLLQME37G')
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
