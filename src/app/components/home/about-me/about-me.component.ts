import { Component, OnInit } from '@angular/core';
import { AboutContent, SkillsContent } from '../../../models/PortfolioContent';
import { ContentService } from '../../../services/contentService.service';

@Component({
  selector: 'app-about-me',
  templateUrl: './about-me.component.html',
  styleUrl: './about-me.component.scss'
})
export class AboutMeComponent implements OnInit {
  about?: AboutContent;
  skills?: SkillsContent;

  constructor(private readonly contentService: ContentService) {}

  ngOnInit(): void {
    this.contentService.getContent().subscribe(content => {
      this.about = content.about;
      this.skills = content.skills;
    });
  }
}
