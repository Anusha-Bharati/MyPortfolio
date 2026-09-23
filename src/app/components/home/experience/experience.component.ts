import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ExperienceItem } from '../../../models/PortfolioContent';
import { ContentService } from '../../../services/contentService.service';
import { GoogleAnalytics } from '../../../services/googleAnalytics.service';

@Component({
  selector: 'app-experience',
  templateUrl: './experience.component.html',
  styleUrl: './experience.component.scss'
})
export class ExperienceComponent implements OnInit {
  title = 'Experience';
  experience: ExperienceItem[] = [];

  @ViewChild('experienceTrack') experienceTrack?: ElementRef<HTMLElement>;

  constructor(
    private readonly contentService: ContentService,
    public readonly googleAnalytics: GoogleAnalytics
  ) {}

  ngOnInit(): void {
    this.contentService.getContent().subscribe(content => {
      this.title = content.experience.title;
      this.experience = content.experience.items;
    });
  }

  scroll(direction: number): void {
    this.experienceTrack?.nativeElement.scrollBy({ left: direction * 620, behavior: 'smooth' });
  }
}
