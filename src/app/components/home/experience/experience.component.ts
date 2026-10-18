import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild
} from '@angular/core';

import { ContentService } from '../../../services/contentService.service';

interface ExperienceItem {
  id?: string;
  role: string;
  company: string;
  dateLabel: string;
  summary: string;
  highlights?: string[];
  technologies?: string[];
  startDate?: string;
  endDate?: string | null;
  companyUrl?: string;
  image?: string;
}

@Component({
  selector: 'app-experience',
  templateUrl: './experience.component.html',
  styleUrls: ['./experience.component.scss']
})
export class ExperienceComponent implements OnInit {
  @ViewChild('rail')
  private rail?: ElementRef<HTMLElement>;

  title = 'Experience';
  experience: ExperienceItem[] = [];

  activeCardIndex = 0;
  expandedExperience = new Set<number>();

  constructor(
    private readonly contentService: ContentService
  ) {}

  ngOnInit(): void {
    this.contentService.getContent().subscribe({
      next: (content) => {
        this.title = content.experience?.title ?? 'Experience';

        this.experience = (
          content.experience?.items ?? []
        ) as ExperienceItem[];

        this.activeCardIndex = 0;
        this.expandedExperience = new Set<number>();
      },
      error: (error:any) => {
        console.error(
          'Could not load experience content:',
          error
        );
      }
    });
  }

  /**
   * Move by one complete visible page.
   * Two cards on desktop; one card on mobile.
   */
  scroll(direction: number): void {
    const rail = this.rail?.nativeElement;

    if (!rail) {
      return;
    }

    const firstCard =
      rail.querySelector<HTMLElement>('.timeline-item');

    if (!firstCard) {
      return;
    }

    const gap = this.getGap(rail);
    const step = firstCard.getBoundingClientRect().width + gap;

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
   * Track the first visible card as the carousel moves.
   */
  updateActiveCards(): void {
    const rail = this.rail?.nativeElement;

    if (!rail) {
      return;
    }

    const firstCard =
      rail.querySelector<HTMLElement>('.timeline-item');

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
   * Only cards in the current visible page are sharp.
   */
  isCardInFocus(index: number): boolean {
    const rail = this.rail?.nativeElement;

    if (!rail) {
      return index < 2;
    }

    const firstCard =
      rail.querySelector<HTMLElement>('.timeline-item');

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
   * Disable navigation arrows at the beginning and end.
   */
  canScroll(direction: number): boolean {
    const visibleCount = this.getVisibleCount();

    if (direction < 0) {
      return this.activeCardIndex > 0;
    }

    return (
      this.activeCardIndex + visibleCount <
      this.experience.length
    );
  }

  /**
   * Expand or collapse the achievement bullet points.
   * The technology chips remain visible in either state.
   */
  toggleExpanded(index: number): void {
    const updated = new Set(this.expandedExperience);

    if (updated.has(index)) {
      updated.delete(index);
    } else {
      updated.add(index);
    }

    this.expandedExperience = updated;
  }

  trackByExperience(
    index: number,
    item: ExperienceItem
  ): string | number {
    return item.id ?? index;
  }

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
   * Calculate how many cards fit in the visible rail.
   */
  private getVisibleCount(
    rail: HTMLElement | undefined = this.rail?.nativeElement,
    suppliedStep?: number
  ): number {
    if (!rail) {
      return 2;
    }

    const firstCard =
      rail.querySelector<HTMLElement>('.timeline-item');

    if (!firstCard) {
      return 2;
    }

    const gap = this.getGap(rail);

    const step =
      suppliedStep ??
      firstCard.getBoundingClientRect().width + gap;

    if (step <= 0) {
      return 1;
    }

    const styles = getComputedStyle(rail);

    const horizontalPadding =
      (Number.parseFloat(styles.paddingLeft) || 0) +
      (Number.parseFloat(styles.paddingRight) || 0);

    const availableWidth = Math.max(
      0,
      rail.clientWidth - horizontalPadding
    );

    return Math.max(
      1,
      Math.round((availableWidth + gap) / step)
    );
  }
}