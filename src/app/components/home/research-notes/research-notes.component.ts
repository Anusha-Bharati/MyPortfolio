import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { ContentService } from '../../../services/contentService.service';

interface ResearchNote {
  title: string;
  status: string;
  category: string;
  tags: string[];
  excerpt: string;
  markdownUrl?: string | null;
  visible?: boolean;
}

@Component({
  selector: 'app-research-notes',
  templateUrl: './research-notes.component.html',
  styleUrl: './research-notes.component.scss'
})
export class ResearchNotesComponent implements OnInit, OnDestroy {

  title = 'Research Notes';

  subtitle =
    'Things I encounter, question and learn while working through data and machine-learning problems.';

  notes: ResearchNote[] = [];

  selectedNote: ResearchNote | null = null;
  renderedMarkdown = '';

  loadingNote = false;
  noteError = '';

  @ViewChild('noteTrack')
  noteTrack?: ElementRef<HTMLElement>;

  @ViewChild('articlePanel')
  articlePanel?: ElementRef<HTMLElement>;

  private readonly contentBaseUrl =
    'https://raw.githubusercontent.com/Anusha-Bharati/AB-portfolio-content/main/';

  private readonly destroy$ = new Subject<void>();

  private noteRequest?: Subscription;

  constructor(
    private readonly contentService: ContentService,
    private readonly http: HttpClient
  ) {}

  ngOnInit(): void {
    this.contentService
      .getContent()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: content => {
          this.title = content.researchNotes.title;
          this.subtitle = content.researchNotes.subtitle;

          this.notes = content.researchNotes.items
            .filter(note => note.visible);
        },
        error: error => {
          console.error('Could not load research notes:', error);
        }
      });
  }

  ngOnDestroy(): void {
    this.noteRequest?.unsubscribe();

    this.destroy$.next();
    this.destroy$.complete();
  }

  scroll(direction: number): void {
    const track = this.noteTrack?.nativeElement;

    if (!track) {
      return;
    }

    track.scrollBy({
      left: direction * track.clientWidth * 0.75,
      behavior: 'smooth'
    });
  }

  getNoteUrl(note: ResearchNote): string {
    const path = note.markdownUrl?.trim();

    if (!path) {
      return '';
    }

    // Allow either a full URL or a path within the content repository.
    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    return this.contentBaseUrl + path.replace(/^\/+/, '');
  }

  openNote(note: ResearchNote): void {
    if (note.status.toLowerCase() !== 'published') {
      return;
    }

    const url = this.getNoteUrl(note);

    if (!url) {
      this.noteError = 'This note does not have a Markdown file configured.';
      this.selectedNote = note;
      return;
    }

    this.noteRequest?.unsubscribe();

    this.selectedNote = note;
    this.renderedMarkdown = '';
    this.noteError = '';
    this.loadingNote = true;

    const separator = url.includes('?') ? '&' : '?';
    const freshUrl = `${url}${separator}v=${Date.now()}`;

    this.noteRequest = this.http
      .get(freshUrl, { responseType: 'text' })
      .subscribe({
        next: markdown => {
          if (this.selectedNote !== note) {
            return;
          }

          this.renderedMarkdown = this.markdownToHtml(markdown);
          this.loadingNote = false;

          // Wait for Angular to render the article panel before scrolling.
          setTimeout(() => {
            this.articlePanel?.nativeElement.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }, 0);
        },

        error: error => {
          if (this.selectedNote !== note) {
            return;
          }

          console.error('Could not load research note:', error);

          this.loadingNote = false;
          this.noteError =
            'Could not load this note. Check that the Markdown file exists in your content repository.';
        }
      });
  }
  getSlug(note: { title: string; slug?: string }): string {
    return note.slug || note.title
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  closeNote(): void {
    this.noteRequest?.unsubscribe();

    this.selectedNote = null;
    this.renderedMarkdown = '';
    this.noteError = '';
    this.loadingNote = false;
  }

  /**
   * Small Markdown renderer for portfolio notes.
   * Supports headings, paragraphs, lists, quotes, links,
   * bold, italic, inline code and fenced code blocks.
   *
   * Raw HTML is escaped before rendering.
   * Angular also sanitises the resulting innerHTML.
   */
  private markdownToHtml(markdown: string): string {

    const escapeHtml = (value: string): string =>
      value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const inline = (value: string): string => {
      let html = escapeHtml(value);

      html = html.replace(
        /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
      );

      html = html.replace(
        /`([^`]+)`/g,
        '<code>$1</code>'
      );

      html = html.replace(
        /\*\*(.+?)\*\*/g,
        '<strong>$1</strong>'
      );

      html = html.replace(
        /(^|[^\*])\*([^*]+)\*/g,
        '$1<em>$2</em>'
      );

      return html;
    };

    const lines = markdown
      .replace(/\r\n?/g, '\n')
      .split('\n');

    const output: string[] = [];

    let paragraph: string[] = [];
    let listItems: string[] = [];
    let listType: 'ul' | 'ol' | null = null;

    let insideCodeBlock = false;
    let codeLines: string[] = [];

    const flushParagraph = (): void => {
      if (paragraph.length) {
        output.push(`<p>${inline(paragraph.join(' '))}</p>`);
        paragraph = [];
      }
    };

    const flushList = (): void => {
      if (listType && listItems.length) {
        const items = listItems
          .map(item => `<li>${inline(item)}</li>`)
          .join('');

        output.push(`<${listType}>${items}</${listType}>`);
      }

      listItems = [];
      listType = null;
    };

    const flushBlocks = (): void => {
      flushParagraph();
      flushList();
    };

    for (const line of lines) {

      if (line.trim().startsWith('```')) {
        if (!insideCodeBlock) {
          flushBlocks();
          insideCodeBlock = true;
          codeLines = [];
        } else {
          output.push(
            `<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`
          );

          insideCodeBlock = false;
          codeLines = [];
        }

        continue;
      }

      if (insideCodeBlock) {
        codeLines.push(line);
        continue;
      }

      if (!line.trim()) {
        flushBlocks();
        continue;
      }

      const heading = line.match(/^(#{1,4})\s+(.+)$/);

      if (heading) {
        flushBlocks();

        // The article title is already displayed in the panel.
        const level = Math.min(4, heading[1].length + 1);

        output.push(
          `<h${level}>${inline(heading[2])}</h${level}>`
        );

        continue;
      }

      if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
        flushBlocks();
        output.push('<hr>');
        continue;
      }

      const unordered = line.match(/^\s*[-*+]\s+(.+)$/);

      if (unordered) {
        flushParagraph();

        if (listType && listType !== 'ul') {
          flushList();
        }

        listType = 'ul';
        listItems.push(unordered[1]);

        continue;
      }

      const ordered = line.match(/^\s*\d+\.\s+(.+)$/);

      if (ordered) {
        flushParagraph();

        if (listType && listType !== 'ol') {
          flushList();
        }

        listType = 'ol';
        listItems.push(ordered[1]);

        continue;
      }

      const quote = line.match(/^>\s?(.*)$/);

      if (quote) {
        flushBlocks();
        output.push(`<blockquote><p>${inline(quote[1])}</p></blockquote>`);
        continue;
      }

      // A normal paragraph following a list starts a new block.
      if (listType) {
        flushList();
      }

      paragraph.push(line.trim());
    }

    flushBlocks();

    if (insideCodeBlock && codeLines.length) {
      output.push(
        `<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`
      );
    }

    return output.join('\n');
  }
}