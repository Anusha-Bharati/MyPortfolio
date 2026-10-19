import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  Inject,
  Injectable,
  NgZone,
  OnDestroy,
  PLATFORM_ID
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { filter, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GoogleAnalytics implements OnDestroy {
  /**
   * Homepage sections to track when they enter the viewport.
   * These IDs match the section IDs in your templates.
   */
  private readonly trackedSectionIds = [
    'home',
    'about',
    'experience',
    'projects',
    'research-notes',
    'contact'
  ];

  /**
   * Prevent duplicate section-view events during the same visit.
   */
  private readonly viewedSections = new Set<string>();

  /**
   * Track which DOM elements are already observed.
   */
  private readonly observedSections = new Set<Element>();

  /**
   * Avoid repeated carousel-scroll events for the same carousel.
   */
  private readonly interactedCarousels = new WeakSet<Element>();

  /**
   * All interactive elements are tracked automatically.
   */
  private readonly interactiveSelector =
    'button, a, [role="button"], input[type="button"], input[type="submit"]';

  private sectionObserver?: IntersectionObserver;
  private domObserver?: MutationObserver;
  private routeSubscription?: Subscription;
  private browserEnabled = false;

  /**
   * Track clicks on buttons and links across the entire application.
   *
   * Capture phase ensures the event is recorded even when an Angular
   * click handler subsequently scrolls, navigates or opens a link.
   */
  private readonly onDocumentClick = (event: Event): void => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const interactive = target.closest(
      this.interactiveSelector
    ) as HTMLElement | null;

    if (!interactive) {
      return;
    }

    // Ignore disabled controls.
    if (
      interactive.matches(':disabled') ||
      interactive.getAttribute('aria-disabled') === 'true'
    ) {
      return;
    }

    const isLink = interactive.tagName.toLowerCase() === 'a';

    const section = interactive.closest(
      'section[id], article[id]'
    ) as HTMLElement | null;

    const scope =
      section?.id ||
      (interactive.closest('header')
        ? 'navigation'
        : interactive.closest('footer')
          ? 'footer'
          : 'global');

    const label = this.getInteractiveLabel(interactive);

    const destination = isLink
      ? (interactive as HTMLAnchorElement).getAttribute('href')
      : null;

    const eventLabel = [
      label,
      destination ? `destination=${destination}` : ''
    ]
      .filter(Boolean)
      .join(' | ')
      .slice(0, 150);

    this.sendGoogleAnalytics(
      isLink ? 'link_click' : 'button_click',
      scope,
      eventLabel
    );
  };

  /**
   * Track engagement with horizontally scrollable carousels.
   * Each carousel instance sends this event only once.
   */
  private readonly onDocumentScroll = (event: Event): void => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const carousel = target.matches('.content-rail, .note-track')
      ? target
      : target.closest('.content-rail, .note-track');

    if (!carousel || this.interactedCarousels.has(carousel)) {
      return;
    }

    this.interactedCarousels.add(carousel);

    const section = carousel.closest(
      'section[id]'
    ) as HTMLElement | null;

    const scope = section?.id ?? 'carousel';

    const label =
      carousel.getAttribute('aria-label')?.trim() ||
      `${scope} horizontal carousel`;

    this.sendGoogleAnalytics(
      'carousel_scroll',
      scope,
      label
    );
  };

  constructor(
    public readonly gaService: GoogleAnalyticsService,
    @Inject(DOCUMENT) private readonly document: Document,
    @Inject(PLATFORM_ID) platformId: object,
    private readonly zone: NgZone,
    private readonly router: Router
  ) {
    if (!isPlatformBrowser(platformId)) {
      return;
    }

    this.browserEnabled = true;

    // Keep global tracking listeners outside Angular change detection.
    this.zone.runOutsideAngular(() => {
      this.document.addEventListener(
        'click',
        this.onDocumentClick,
        true
      );

      this.document.addEventListener(
        'scroll',
        this.onDocumentScroll,
        true
      );

      this.createSectionObserver();

      // Watch for sections created later by Angular or route navigation.
      const MutationObserverConstructor =
        this.document.defaultView?.MutationObserver;

      if (
        MutationObserverConstructor &&
        this.document.body
      ) {
        this.domObserver = new MutationObserverConstructor(() => {
          this.removeDetachedSections();
          this.observeTrackedSections();
        });

        this.domObserver.observe(this.document.body, {
          childList: true,
          subtree: true
        });
      }
    });

    // Allow section views to be recorded again after a route change.
    this.routeSubscription = this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd =>
            event instanceof NavigationEnd
        )
      )
      .subscribe(() => {
        this.viewedSections.clear();

        this.observedSections.forEach(section => {
          this.sectionObserver?.unobserve(section);
        });

        this.observedSections.clear();
        this.observeTrackedSections();
      });
  }

  /**
   * Preserve the existing method used to send analytics events.
   */
  sendGoogleAnalytics(
    action: string,
    category: string,
    label: any
  ): void {
    this.gaService.event(action, category, label);
  }

  /**
   * Preserve the existing page-view tracking method.
   */
  sendPageViewAnalytics(
    path: string,
    title: string
  ): void {
    this.gaService.pageView(path, title);
  }

  /**
   * Observe sections as they enter the viewport.
   */
  private createSectionObserver(): void {
    const IntersectionObserverConstructor =
      this.document.defaultView?.IntersectionObserver;

    if (!IntersectionObserverConstructor) {
      return;
    }

    this.sectionObserver = new IntersectionObserverConstructor(
      entries => {
        for (const entry of entries) {
          if (
            !entry.isIntersecting ||
            entry.intersectionRatio < 0.15
          ) {
            continue;
          }

          const sectionId = (
            entry.target as HTMLElement
          ).id;

          if (
            !sectionId ||
            this.viewedSections.has(sectionId)
          ) {
            continue;
          }

          this.viewedSections.add(sectionId);

          this.sendGoogleAnalytics(
            'section_view',
            'portfolio_section',
            sectionId
          );
        }
      },
      {
        threshold: [0.15, 0.3, 0.5],
        rootMargin: '0px 0px -5% 0px'
      }
    );

    this.observeTrackedSections();
  }

  /**
   * Find and observe all configured sections currently in the DOM.
   */
  private observeTrackedSections(): void {
    if (!this.sectionObserver) {
      return;
    }

    this.removeDetachedSections();

    for (const sectionId of this.trackedSectionIds) {
      const section = this.document.getElementById(sectionId);

      if (
        !section ||
        this.observedSections.has(section)
      ) {
        continue;
      }

      this.observedSections.add(section);
      this.sectionObserver.observe(section);
    }
  }

  /**
   * Remove references to elements that Angular has removed.
   */
  private removeDetachedSections(): void {
    for (const section of this.observedSections) {
      if (
        !this.document.documentElement.contains(section)
      ) {
        this.sectionObserver?.unobserve(section);
        this.observedSections.delete(section);
      }
    }
  }

  /**
   * Prefer accessible labels over visual text.
   * This gives arrow buttons meaningful analytics labels.
   */
  private getInteractiveLabel(
    element: HTMLElement
  ): string {
    const explicitLabel =
      element.getAttribute('data-ga-label')?.trim();

    const accessibleLabel =
      element.getAttribute('aria-label')?.trim();

    const title =
      element.getAttribute('title')?.trim();

    const text = (
      element.innerText ||
      element.textContent ||
      ''
    )
      .replace(/\s+/g, ' ')
      .trim();

    const destination =
      element.tagName.toLowerCase() === 'a'
        ? (element as HTMLAnchorElement).getAttribute('href')
        : null;

    return (
      explicitLabel ||
      accessibleLabel ||
      title ||
      text ||
      destination ||
      element.tagName.toLowerCase()
    ).slice(0, 100);
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();

    if (!this.browserEnabled) {
      return;
    }

    this.document.removeEventListener(
      'click',
      this.onDocumentClick,
      true
    );

    this.document.removeEventListener(
      'scroll',
      this.onDocumentScroll,
      true
    );

    this.sectionObserver?.disconnect();
    this.domObserver?.disconnect();

    this.observedSections.clear();
    this.viewedSections.clear();
  }
}