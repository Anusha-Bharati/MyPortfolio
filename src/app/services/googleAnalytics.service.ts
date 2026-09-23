import { Injectable } from '@angular/core';
import { GoogleAnalyticsService } from 'ngx-google-analytics';

@Injectable({
  providedIn: 'root'
})
export class GoogleAnalytics {

  constructor(
    public gaService: GoogleAnalyticsService
  ) { }

  sendGoogleAnalytics(action: string, category: string, label:any){
    this.gaService.event(action, category, label)
  }

  sendPageViewAnalytics(path: string, title: string){
    this.gaService.pageView(path, title)
  }

}