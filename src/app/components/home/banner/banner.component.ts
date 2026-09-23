import { Component, OnInit } from '@angular/core';
import { HeroContent, SiteContent } from '../../../models/PortfolioContent';
import { ContentService } from '../../../services/contentService.service';
import { GoogleAnalytics } from '../../../services/googleAnalytics.service';

@Component({
  selector: 'app-banner',
  templateUrl: './banner.component.html',
  styleUrl: './banner.component.scss'
})
export class BannerComponent implements OnInit {
  hero?: HeroContent;
  site?: SiteContent;

  constructor(
    private readonly contentService: ContentService,
    public readonly googleAnalytics: GoogleAnalytics
  ) {}

  ngOnInit(): void {
    this.contentService.getContent().subscribe(content => {
      this.hero = content.hero;
      this.site = content.site;
    });
  }

  scrollTo(target: string): void {
    document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
