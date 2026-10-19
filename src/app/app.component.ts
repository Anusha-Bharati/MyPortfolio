
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';

import AOS from 'aos';
import { Router } from '@angular/router';

import {
  FooterContent,
  NavigationItem,
  SiteContent
} from './models/PortfolioContent';

import { GoogleAnalytics } from './services/googleAnalytics.service';
import { ContentService } from './services/contentService.service';

/**
 * Midnight navy colour palette.
 * Mostly cool blue-white stars, with a few champagne accents.
 */
const STAR_COLOURS = [
  '#DDE8FF',
  '#B4C9F4',
  '#8EA9E2',
  '#C8D4F2',
  '#E7C3A5'
];

const SHOOTING_STAR_COLOURS = [
  '#B9D0FF',
  '#D5DFFF',
  '#E7C3A5'
];

/**
 * Individual animated star.
 */
class TwinklingStar {
  private readonly alpha: number;
  private readonly phase: number;
  private readonly twinkleSpeed: number;

  constructor(
    public readonly x: number,
    public readonly y: number,
    public readonly size: number,
    public readonly colour: string
  ) {
    this.alpha = 0.25 + Math.random() * 0.65;
    this.phase = Math.random() * Math.PI * 2;
    this.twinkleSpeed = 0.018 + Math.random() * 0.04;
  }

  draw(
    context: CanvasRenderingContext2D,
    frame: number
  ): void {
    const twinkle =
  0.65 +
  0.35 * Math.sin(frame * this.twinkleSpeed + this.phase);

    context.globalAlpha = this.alpha * twinkle;
    context.fillStyle = this.colour;

    context.beginPath();
    context.arc(
      this.x,
      this.y,
      this.size,
      0,
      Math.PI * 2
    );
    context.fill();

    context.globalAlpha = 1;
  }
}

/**
 * Animated shooting star.
 */
class ShootingStar {
  private framesLeft: number;

  constructor(
    private x: number,
    private y: number,
    private readonly speedX: number,
    private readonly speedY: number,
    private readonly colour: string,
    private readonly lifespan = 90
  ) {
    this.framesLeft = lifespan;
  }

  get expired(): boolean {
    return this.framesLeft <= 0;
  }

  update(context: CanvasRenderingContext2D): void {
    this.framesLeft--;
    this.x += this.speedX;
    this.y += this.speedY;

    this.draw(context);
  }

  private draw(context: CanvasRenderingContext2D): void {
    const halfLife = this.lifespan / 2;

    const age = Math.max(
      0,
      1 - Math.abs(this.framesLeft - halfLife) / halfLife
    );

    const lengthModifier = age * age;

    if (lengthModifier < 0.02) {
      return;
    }

    const endX = this.x - this.speedX * 22 * lengthModifier;
    const endY = this.y - this.speedY * 22 * lengthModifier;

    const gradient = context.createLinearGradient(
      this.x,
      this.y,
      endX,
      endY
    );

    gradient.addColorStop(0, 'rgba(245, 249, 255, 0.95)');
    gradient.addColorStop(
      Math.max(0.02, Math.min(lengthModifier, 0.72)),
      this.colour
    );
    gradient.addColorStop(1, 'rgba(7, 11, 24, 0)');

    context.beginPath();
    context.moveTo(this.x, this.y);
    context.lineTo(endX, endY);

    context.strokeStyle = gradient;
    context.lineWidth = 1.2;
    context.lineCap = 'round';
    context.stroke();
  }
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent
  implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('starsCanvas')
  private starsCanvasRef!: ElementRef<HTMLCanvasElement>;

  @ViewChild('milkyWayCanvas')
  private milkyWayCanvasRef!: ElementRef<HTMLCanvasElement>;

  site?: SiteContent;
  footer?: FooterContent;
  navigation: NavigationItem[] = [];
  navOpen = false;

  private starsContext: CanvasRenderingContext2D | null = null;
  private milkyWayContext: CanvasRenderingContext2D | null = null;

  private stars: TwinklingStar[] = [];
  private shootingStars: ShootingStar[] = [];

  private animationFrameId: number | null = null;
  private frame = 0;
  private prefersReducedMotion = false;

  constructor(
    private readonly contentService: ContentService,
    public readonly googleAnalytics: GoogleAnalytics,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    AOS.init({
      once: true,
      duration: 450,
      easing: 'ease-out'
    });

    this.contentService.getContent().subscribe(content => {
      this.site = content.site;
      this.footer = content.footer;

      this.navigation = content.navigation
        .filter(item => item.visible)
        .sort((a, b) => a.order - b.order);
    });
  }

  /**
   * Initialise the canvas only after Angular has rendered the HTML.
   */
  ngAfterViewInit(): void {
    this.resizeCanvases();

    this.createStars();
    this.drawMilkyWay();

    this.prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (this.prefersReducedMotion) {
      this.drawStaticStars();
    } else {
      this.animate();
    }
  }

  /**
   * Keep both canvases sharp on high-resolution screens.
   * The device pixel ratio is capped to avoid unnecessary GPU work.
   */
  private resizeCanvases(): void {
    const starsCanvas = this.starsCanvasRef?.nativeElement;
    const milkyWayCanvas = this.milkyWayCanvasRef?.nativeElement;

    if (!starsCanvas || !milkyWayCanvas) {
      return;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    starsCanvas.width = Math.floor(width * pixelRatio);
    starsCanvas.height = Math.floor(height * pixelRatio);

    milkyWayCanvas.width = Math.floor(width * pixelRatio);
    milkyWayCanvas.height = Math.floor(height * pixelRatio);

    this.starsContext = starsCanvas.getContext('2d');
    this.milkyWayContext = milkyWayCanvas.getContext('2d');

    this.starsContext?.setTransform(
      pixelRatio, 0, 0, pixelRatio, 0, 0
    );

    this.milkyWayContext?.setTransform(
      pixelRatio, 0, 0, pixelRatio, 0, 0
    );
  }

  /**
   * Create the foreground stars.
   */
  private createStars(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const starCount = width < 768 ? 240 : 460;

    this.stars = Array.from(
      { length: starCount },
      () => {
        const colour =
          Math.random() < 0.12
            ? '#E7C3A5'
            : STAR_COLOURS[
                Math.floor(Math.random() * (STAR_COLOURS.length - 1))
              ];

        return new TwinklingStar(
          Math.random() * width,
          Math.random() * height,
          0.35 + Math.random() * 0.8,
          colour
        );
      }
    );

    this.shootingStars = [];
    this.frame = 0;
  }

  /**
   * Draw the Milky Way on a separate, static canvas.
   * Keeping it separate means we don't redraw thousands of
   * background particles on every animation frame.
   */
  private drawMilkyWay(): void {
    const context = this.milkyWayContext;

    if (!context) {
      return;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;

    context.clearRect(0, 0, width, height);

    // A subtle diagonal haze gives the galaxy depth.
    const band = context.createLinearGradient(
      0,
      height * 0.9,
      width,
      height * 0.1
    );

    band.addColorStop(0, 'rgba(12, 21, 43, 0)');
    band.addColorStop(0.45, 'rgba(30, 48, 83, 0.16)');
    band.addColorStop(0.6, 'rgba(22, 37, 69, 0.10)');
    band.addColorStop(1, 'rgba(12, 21, 43, 0)');

    context.fillStyle = band;
    context.fillRect(0, 0, width, height);

    // Distant background stars.
    const backgroundStarCount = width < 768 ? 10500 : 20000;

    for (let i = 0; i < backgroundStarCount; i++) {
      const x = Math.random() * width;

      const y =
        Math.random() < 0.22
          ? Math.random() * height
          : height * 0.5 +
            (width * 0.5 - x) * 0.23 +
            (Math.random() - 0.5) * height * 0.75;

      const size = Math.random() * 0.35;
      const alpha = 0.2 + Math.random() * 0.55;

      context.beginPath();
      context.arc(x, y, size, 0, Math.PI * 2);
      context.fillStyle = `rgba(190, 207, 244, ${alpha})`;
      context.fill();
    }

    // Galaxy clusters. The colours are deliberately limited to
    // cool blue and muted violet rather than the original greens
    // and pinks.
    const clusterCount = width < 768 ? 32 : 66;

    for (let i = 0; i < clusterCount; i++) {
      const x = Math.random() * width;

      const y =
        height * 0.5 +
        (width * 0.5 - x) * 0.23 +
        (Math.random() - 0.5) * height * 0.42;

      const horizontalDistance =
        1 - Math.min(
          1,
          Math.abs(x - width * 0.5) / Math.max(width * 0.5, 1)
        );

      const verticalDistance =
        1 - Math.min(
          1,
          Math.abs(y - height * 0.5) / Math.max(height * 0.5, 1)
        );

      const brightness = horizontalDistance * verticalDistance;
      const size = 85 + Math.random() * 115;
      const hue = 208 + Math.random() * 28;

      this.drawCluster(
        context,
        x,
        y,
        size,
        hue,
        brightness
      );
    }
  }

  /**
   * Draw one soft cluster of stars.
   */
  private drawCluster(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    hue: number,
    brightness: number
  ): void {
    const layers = 7;
    const starsPerLayer = 34;

    for (let layer = 1; layer < layers; layer++) {
      const layerRadius = size * layer / layers;

      for (let i = 0; i < starsPerLayer; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.sqrt(Math.random()) * layerRadius;

        const starX = x + Math.cos(angle) * distance;
        const starY = y + Math.sin(angle) * distance;

        const starSize = 0.06 + Math.random() * 0.18;
        const alpha =
          (0.08 + Math.random() * 0.2) *
          (0.7 + brightness * 0.5);

        const lightness = 55 + Math.random() * 25;

        context.beginPath();
        context.arc(starX, starY, starSize, 0, Math.PI * 2);

        context.fillStyle =
          `hsla(${hue}, 58%, ${lightness}%, ${alpha})`;

        context.fill();
      }
    }

    // Soft glow around the cluster.
    const gradient = context.createRadialGradient(
      x, y, 0,
      x, y, size
    );

    gradient.addColorStop(
      0,
      `hsla(${hue}, 55%, 48%, ${0.025 + brightness * 0.02})`
    );

    gradient.addColorStop(
      0.35,
      `hsla(${hue}, 62%, 36%, ${0.018 + brightness * 0.01})`
    );

    gradient.addColorStop(1, 'rgba(7, 11, 24, 0)');

    context.beginPath();
    context.arc(x, y, size, 0, Math.PI * 2);
    context.fillStyle = gradient;
    context.fill();
  }

  /**
   * Draw a still version for visitors who prefer reduced motion.
   */
  private drawStaticStars(): void {
    const context = this.starsContext;

    if (!context) {
      return;
    }

    context.clearRect(
      0,
      0,
      window.innerWidth,
      window.innerHeight
    );

    for (const star of this.stars) {
      star.draw(context, 0);
    }
  }

  /**
   * Animate the foreground stars and occasional shooting stars.
   */
  private animate = (): void => {
    const context = this.starsContext;

    if (!context) {
      return;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;

    context.clearRect(0, 0, width, height);

    this.frame++;

    for (const star of this.stars) {
      star.draw(context, this.frame);
    }

    // Occasional shooting star, travelling diagonally from top to bottom.
    if (Math.random() < 0.0020) {
      const speedY = 2.2 + Math.random() * 0.6;
      const lifespan = Math.ceil((height + 30) / speedY);

      // Choose a diagonal direction and keep the trail on screen.
      const direction = Math.random() < 0.5 ? 1 : -1;
      const desiredSpeedX = speedY * (0.22 + Math.random() * 0.1);
      const speedX =
        direction *
        Math.min(desiredSpeedX, (width * 0.65) / lifespan);

      const horizontalTravel = Math.abs(speedX) * lifespan;
      const availableWidth = Math.max(0, width - horizontalTravel);

      const x = direction > 0
        ? Math.random() * availableWidth
        : horizontalTravel + Math.random() * availableWidth;

      const y = -10;

      const colour =
        SHOOTING_STAR_COLOURS[
          Math.floor(Math.random() * SHOOTING_STAR_COLOURS.length)
        ];

      this.shootingStars.push(
        new ShootingStar(x, y, speedX, speedY, colour, lifespan)
      );
    }

    for (let i = this.shootingStars.length - 1; i >= 0; i--) {
      const shootingStar = this.shootingStars[i];

      if (shootingStar.expired) {
        this.shootingStars.splice(i, 1);
        continue;
      }

      shootingStar.update(context);
    }

    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  /**
   * Redraw the canvases when the browser is resized or rotated.
   */
  @HostListener('window:resize')
  onResize(): void {
    if (!this.starsCanvasRef || !this.milkyWayCanvasRef) {
      return;
    }

    this.resizeCanvases();
    this.createStars();
    this.drawMilkyWay();

    if (this.prefersReducedMotion) {
      this.drawStaticStars();
    }
  }

  /**
   * Stop the animation when Angular destroys the component.
   */
  ngOnDestroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  navigateToItem(item: NavigationItem): void {
    this.navOpen = false;

    if (item.id === 'blog') {
      void this.router.navigateByUrl('/blog');
      return;
    }

    this.navigateToSection(item.sectionId);
  }

  navigateToSection(sectionId: string): void {
    this.navOpen = false;

    if (this.router.url !== '/') {
      void this.router.navigateByUrl('/').then(() => {
        setTimeout(() => this.scrollIntoView(sectionId), 0);
      });

      return;
    }

    this.scrollIntoView(sectionId);
  }

  scrollIntoView(sectionId: string): void {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

    this.navOpen = false;
  }

  downloadCV(): void {
    if (this.site?.resumeUrl) {
      window.open(
        this.site.resumeUrl,
        '_blank',
        'noopener,noreferrer'
      );
    }
  }
}
