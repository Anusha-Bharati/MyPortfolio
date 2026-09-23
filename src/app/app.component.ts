import { Component, OnInit } from '@angular/core';
import AOS from 'aos';
import { FooterContent, NavigationItem, SiteContent } from './models/PortfolioContent';
import { GoogleAnalytics } from './services/googleAnalytics.service';
import { ContentService } from './services/contentService.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  site?: SiteContent;
  footer?: FooterContent;
  navigation: NavigationItem[] = [];
  navOpen = false;

  constructor(
    private readonly contentService: ContentService,
    public readonly googleAnalytics: GoogleAnalytics
  ) {}

  ngOnInit(): void {
    AOS.init({ once: true, duration: 650, easing: 'ease-out-cubic' });
    this.contentService.getContent().subscribe(content => {
      this.site = content.site;
      this.footer = content.footer;
      this.navigation = content.navigation
        .filter(item => item.visible)
        .sort((a, b) => a.order - b.order);
    });
  }

  scrollIntoView(sectionId: string): void {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    this.navOpen = false;
  }

  downloadCV(): void {
    if (this.site?.resumeUrl) {
      window.open(this.site.resumeUrl, '_blank', 'noopener,noreferrer');
    }
  }
}
