import { Component, OnInit } from '@angular/core';
import { ContactContent } from '../../../models/PortfolioContent';
import { ContentService } from '../../../services/contentService.service';
import { GoogleAnalytics } from '../../../services/googleAnalytics.service';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent implements OnInit {
  contact?: ContactContent;

  constructor(
    private readonly contentService: ContentService,
    public readonly googleAnalytics: GoogleAnalytics
  ) {}

  ngOnInit(): void {
    this.contentService.getContent().subscribe(content => this.contact = content.contact);
  }
}
