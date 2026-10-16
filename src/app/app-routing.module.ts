import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BlogComponent } from './components/blog/blog.component';
import { HomeComponent } from './components/home/home.component';

const routes: Routes = [
 
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'blog', component: BlogComponent },
  { path: 'blog/:slug', component: BlogComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

export class AppRoutingModule { }
 