import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild
} from '@angular/core';

import { ContentService } from '../../../services/contentService.service';

interface ProjectItem {
  id?: string;
  slug?: string;
  title: string;
  type?: string;
  status?: string;
  featured?: boolean;
  visible?: boolean;
  summary?: string;
  problem?: string;
  image?: string;
  technologies?: string[];
  topics?: string[];
  highlights?: string[];
  githubUrl?: string;
  demoUrl?: string;
  researchNoteSlug?: string | null;
  confidentialityNote?: string | null;
}

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss']
})
export class ProjectsComponent implements OnInit {
  @ViewChild('projectTrack')
  private projectTrack?: ElementRef<HTMLDivElement>;

  title = 'Selected Projects';
  subtitle = '';

  projects: ProjectItem[] = [];
  activeCardIndex = 0;

  constructor(
    private readonly contentService: ContentService
  ) {}

  ngOnInit(): void {
    this.contentService.getContent().subscribe({
      next: (content) => {
        const projectSection = content.projects;

        this.title = projectSection?.title ?? 'Selected Projects';
        this.subtitle = projectSection?.subtitle ?? '';

        this.projects = (projectSection?.items ?? [])
          .filter(project => project.visible !== false) as ProjectItem[];

        this.activeCardIndex = 0;
      },
      error: (error: any) => {
        console.error(
          'Could not load project content from GitHub:',
          error
        );
      }
    });
  }

  /**
   * Scroll by one complete visible page:
   * two cards on desktop and one card on mobile.
   */
  scroll(direction: number): void {
    const rail = this.projectTrack?.nativeElement;

    if (!rail) {
      return;
    }

    const firstCard = rail.querySelector<HTMLElement>('.content-card');

    if (!firstCard) {
      return;
    }

    const gap = this.getGap(rail);
    const cardWidth = firstCard.getBoundingClientRect().width;
    const step = cardWidth + gap;

    if (step <= 0) {
      return;
    }

    const visibleCount = this.getVisibleCount(rail, step);

    rail.scrollBy({
      left: direction * step * visibleCount,
      behavior: 'smooth'
    });
  }

  /**
   * Keep the active card index in sync with the horizontal carousel.
   */
  updateActiveCards(): void {
    const rail = this.projectTrack?.nativeElement;

    if (!rail) {
      return;
    }

    const firstCard = rail.querySelector<HTMLElement>('.content-card');

    if (!firstCard) {
      this.activeCardIndex = 0;
      return;
    }

    const gap = this.getGap(rail);
    const step = firstCard.getBoundingClientRect().width + gap;

    if (step <= 0) {
      return;
    }

    this.activeCardIndex = Math.max(
      0,
      Math.round(rail.scrollLeft / step)
    );
  }

  /**
   * Only the cards in the current visible page are sharp.
   */
  isCardInFocus(index: number): boolean {
    const rail = this.projectTrack?.nativeElement;

    if (!rail) {
      return index < 2;
    }

    const firstCard = rail.querySelector<HTMLElement>('.content-card');

    if (!firstCard) {
      return index < 2;
    }

    const gap = this.getGap(rail);
    const step = firstCard.getBoundingClientRect().width + gap;
    const visibleCount = this.getVisibleCount(rail, step);

    return (
      index >= this.activeCardIndex &&
      index < this.activeCardIndex + visibleCount
    );
  }

  /**
   * Enable or disable the previous/next buttons.
   */
  canScroll(direction: number): boolean {
    const visibleCount = this.getVisibleCount();

    if (direction < 0) {
      return this.activeCardIndex > 0;
    }

    return this.activeCardIndex + visibleCount < this.projects.length;
  }

  /**
   * Format statuses such as "in-progress" for display.
   */
  formatStatus(status: string): string {
    return status
      .replace(/-/g, ' ')
      .replace(/\b\w/g, character => character.toUpperCase());
  }

  trackByProject(index: number, project: ProjectItem): string | number {
    return project.id ?? project.slug ?? index;
  }

  /**
   * Recalculate card positions when the viewport changes.
   */
  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateActiveCards();
  }

  private getGap(rail: HTMLElement): number {
    const styles = getComputedStyle(rail);

    return (
      Number.parseFloat(styles.columnGap || styles.gap || '0') || 0
    );
  }

  /**
   * Calculate the number of complete cards that fit in the rail.
   */
  private getVisibleCount(
    rail?: HTMLElement,
    suppliedStep?: number
  ): number {
    const element = rail ?? this.projectTrack?.nativeElement;

    if (!element) {
      return 2;
    }

    const firstCard = element.querySelector<HTMLElement>('.content-card');

    if (!firstCard) {
      return 2;
    }

    const gap = this.getGap(element);
    const step =
      suppliedStep ??
      firstCard.getBoundingClientRect().width + gap;

    if (step <= 0) {
      return 1;
    }

    const styles = getComputedStyle(element);

    const horizontalPadding =
      (Number.parseFloat(styles.paddingLeft) || 0) +
      (Number.parseFloat(styles.paddingRight) || 0);

    const availableWidth = Math.max(
      0,
      element.clientWidth - horizontalPadding
    );

    return Math.max(
      1,
      Math.round((availableWidth + gap) / step)
    );
  }
}