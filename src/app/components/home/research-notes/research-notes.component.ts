import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ResearchNote } from '../../../models/PortfolioContent';
import { ContentService } from '../../../services/contentService.service';

@Component({
  selector: 'app-research-notes',
  templateUrl: './research-notes.component.html',
  styleUrl: './research-notes.component.scss'
})
export class ResearchNotesComponent implements OnInit {
  title = 'Research Notes';
  subtitle = '';
  notes: ResearchNote[] = [];

  @ViewChild('noteTrack') noteTrack?: ElementRef<HTMLElement>;

  constructor(private readonly contentService: ContentService) {}

  ngOnInit(): void {
    this.contentService.getContent().subscribe(content => {
      this.title = content.researchNotes.title;
      this.subtitle = content.researchNotes.subtitle;
      this.notes = content.researchNotes.items.filter(note => note.visible);
    });
  }

  scroll(direction: number): void {
    this.noteTrack?.nativeElement.scrollBy({ left: direction * 430, behavior: 'smooth' });
  }

  getNoteUrl(note: ResearchNote): string {
    return `https://github.com/Anusha-Bharati/AB-portfolio-content/blob/main/${note.markdownUrl}`;
  }
}
