import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ProjectItem } from '../../../models/PortfolioContent';
import { ContentService } from '../../../services/contentService.service';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss'
})
export class ProjectsComponent implements OnInit {
  title = 'Selected Projects';
  subtitle = '';
  projects: ProjectItem[] = [];

  @ViewChild('projectTrack') projectTrack?: ElementRef<HTMLElement>;

  constructor(private readonly contentService: ContentService) {}

  ngOnInit(): void {
    this.contentService.getContent().subscribe(content => {
      this.title = content.projects.title;
      this.subtitle = content.projects.subtitle;
      this.projects = content.projects.items.filter(project => project.visible);
    });
  }

  scroll(direction: number): void {
    const track = this.projectTrack?.nativeElement;
  
    if (!track) return;
  
    track.scrollBy({
      left: direction * track.clientWidth * 0.7,
      behavior: 'smooth'
    });
  }
}
