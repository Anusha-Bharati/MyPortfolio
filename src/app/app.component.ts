import { Component, OnInit, HostListener } from '@angular/core';
import AOS from 'aos';
import { FooterContent, NavigationItem, SiteContent } from './models/PortfolioContent';
import { GoogleAnalytics } from './services/googleAnalytics.service';
import { ContentService } from './services/contentService.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {
  site?: SiteContent;
  footer?: FooterContent;
  navigation: NavigationItem[] = [];
  navOpen = false;

  constructor(
    private readonly contentService: ContentService,
    public readonly googleAnalytics: GoogleAnalytics
  ) {}

  ngOnInit(): void { 
      AOS.init({
        once: true,
        duration: 650,
        easing: 'ease-out-cubic'
      });
    
      this.contentService.getContent().subscribe(content => {
        this.site = content.site;
        this.footer = content.footer;
    
        this.navigation = content.navigation
          .filter(item => item.visible)
          .sort((a, b) => a.order - b.order);
      });
    }
 
  scrollIntoView(sectionId: string): void {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    this.navOpen = false;
  }

  downloadCV(): void {
    if (this.site?.resumeUrl) {
      window.open(this.site.resumeUrl, '_blank', 'noopener,noreferrer');
    }
  }
}
  /* ============================================================
   PROCEDURAL MILKY WAY BACKGROUND
   Paste this at the BOTTOM of app.component.ts.

   No HTML changes.
   No SCSS changes.
   No image assets.
   No packages.
============================================================ */

(() => {

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  /*
   * Prevent duplicate canvases/listeners during Angular hot reload.
   */
  const existingCleanup = (window as any).__portfolioGalaxyCleanup;

  if (typeof existingCleanup === 'function') {
    existingCleanup();
  }


  /* ============================================================
     COLOUR PALETTE
  ============================================================ */

  const COLORS = {

    // Main background
    background: '#090D16',

    // Very subtle deep-blue atmospheric tones
    deepBlue: '#111827',
    blueGlow: '#25344A',

    // Nude / champagne tones
    champagne: '#E7C3A5',
    rose: '#C99D98',

    // Star colours
    ivory: '#FFF9F4',
    warmWhite: '#F2E7DC',
    coolWhite: '#DCE6F2'

  };


  /* ============================================================
     CANVAS SETUP
  ============================================================ */

  const canvas = document.createElement('canvas');

  canvas.id = 'procedural-milky-way';

  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100vw',
    height: '100vh',
    pointerEvents: 'none',
    zIndex: '0'
  });

  document.body.prepend(canvas);


  /*
   * Put the Angular application above the canvas.
   *
   * This also fixes the opaque app-root background hiding
   * the galaxy.
   */
  const appRoot =
    document.querySelector('app-root') as HTMLElement | null;

  if (appRoot) {

    appRoot.style.position = 'relative';

    appRoot.style.zIndex = '1';

    appRoot.style.background = 'transparent';

  }


  document.documentElement.style.background =
    COLORS.background;

  document.body.style.background =
    COLORS.background;


  const context = canvas.getContext('2d', {
    alpha: false
  });
  
  if (context === null) {
    canvas.remove();
    return;
  }
  
  const ctx: CanvasRenderingContext2D = context;

  /* ============================================================
     STATE
  ============================================================ */

  let width = window.innerWidth;
  let height = window.innerHeight;

  let dpr = Math.min(
    window.devicePixelRatio || 1,
    1.5
  );


  /*
   * Cursor target.
   *
   * -1 → 1 range.
   */
  let targetX = 0;
  let targetY = 0;

  let mouseX = 0;
  let mouseY = 0;


  /*
   * Animation frame
   */
  let frameId = 0;

  let resizeTimer: ReturnType<typeof setTimeout>;


  const prefersReducedMotion =
    window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

  const hasPointer =
    window.matchMedia(
      '(hover: hover) and (pointer: fine)'
    ).matches;


  /* ============================================================
     SEEDED RANDOM
     Makes the same galaxy appear every refresh.
  ============================================================ */

  function randomFactory(seed: number) {

    let value = seed;

    return () => {

      value += 0x6D2B79F5;

      let t = value;

      t = Math.imul(
        t ^ (t >>> 15),
        t | 1
      );

      t ^= t +
        Math.imul(
          t ^ (t >>> 7),
          t | 61
        );

      return (
        (t ^ (t >>> 14)) >>> 0
      ) / 4294967296;

    };

  }


  const random =
    randomFactory(20261011);


  function randomBetween(
    min: number,
    max: number
  ): number {

    return min +
      random() * (max - min);

  }


  /* ============================================================
     OFFSCREEN LAYERS
  ============================================================ */

  let farStars =
    document.createElement('canvas');

  let nearStars =
    document.createElement('canvas');

  let galaxy =
    document.createElement('canvas');


  function prepareLayer(
    layer: HTMLCanvasElement
  ): CanvasRenderingContext2D {

    layer.width = width * dpr;
    layer.height = height * dpr;

    const layerContext =
      layer.getContext('2d')!;

    layerContext.setTransform(
      dpr,
      0,
      0,
      dpr,
      0,
      0
    );

    return layerContext;

  }


  /* ============================================================
     BACKGROUND STAR FIELD
  ============================================================ */

  function createStarField(
    context: CanvasRenderingContext2D,
    count: number,
    minimumSize: number,
    maximumSize: number,
    maximumOpacity: number
  ): void {

    const colours = [
      COLORS.ivory,
      COLORS.warmWhite,
      COLORS.coolWhite,
      COLORS.champagne
    ];


    for (
      let i = 0;
      i < count;
      i++
    ) {

      const x =
        randomBetween(0, width);

      const y =
        randomBetween(0, height);


      /*
       * Most stars should be extremely small.
       *
       * Squaring random() heavily favours tiny points.
       */
      const radius =
        minimumSize +
        Math.pow(random(), 3) *
        (maximumSize - minimumSize);


      const opacity =
        randomBetween(
          0.12,
          maximumOpacity
        );


      const colour =
        colours[
          Math.floor(
            random() * colours.length
          )
        ];


      context.beginPath();

      context.globalAlpha =
        opacity;

      context.fillStyle =
        colour;

      context.arc(
        x,
        y,
        radius,
        0,
        Math.PI * 2
      );

      context.fill();


      /*
       * Only a tiny percentage get a soft halo.
       *
       * Avoids the childish "sparkle" appearance.
       */
      if (
        radius > 1 &&
        random() > 0.965
      ) {

        const gradient =
          context.createRadialGradient(
            x,
            y,
            0,
            x,
            y,
            radius * 5
          );

        gradient.addColorStop(
          0,
          'rgba(255,249,244,.30)'
        );

        gradient.addColorStop(
          1,
          'rgba(255,249,244,0)'
        );


        context.globalAlpha = 1;

        context.fillStyle =
          gradient;

        context.beginPath();

        context.arc(
          x,
          y,
          radius * 5,
          0,
          Math.PI * 2
        );

        context.fill();

      }

    }


    context.globalAlpha = 1;

  }


  /* ============================================================
     MILKY WAY
  ============================================================ */

  function createMilkyWay(
    context: CanvasRenderingContext2D
  ): void {


    /*
     * Main galaxy travels diagonally:
     *
     *        \
     *         \
     *          \
     *
     * This feels much closer to a photographic Milky Way
     * composition than a horizontal cloud.
     */


    const centerX =
      width * 0.48;

    const centerY =
      height * 0.40;


    /*
     * Angle of the galaxy.
     */
    const angle =
      -0.42;


    const cos =
      Math.cos(angle);

    const sin =
      Math.sin(angle);


    /*
     * Atmospheric broad glow.
     */

    const atmosphericGradient =
      context.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        Math.max(width, height) * 0.75
      );


    atmosphericGradient.addColorStop(
      0,
      'rgba(231,195,165,.045)'
    );

    atmosphericGradient.addColorStop(
      0.35,
      'rgba(201,157,152,.025)'
    );

    atmosphericGradient.addColorStop(
      1,
      'rgba(9,13,22,0)'
    );


    context.fillStyle =
      atmosphericGradient;

    context.fillRect(
      0,
      0,
      width,
      height
    );


    /*
     * Fine dust cloud.
     *
     * Thousands of low-opacity particles create the
     * Milky Way texture without an image.
     */

    const dustCount =
      Math.min(
        4200,
        Math.floor(
          width * height / 280
        )
      );


    for (
      let i = 0;
      i < dustCount;
      i++
    ) {

      /*
       * Position along galaxy axis.
       */

      const along =
        randomBetween(
          -width * 0.85,
          width * 0.85
        );


      /*
       * Gaussian-ish distribution around centre band.
       *
       * Average several random values to produce
       * natural density near the middle.
       */

      const spreadRandom =
        (
          random() +
          random() +
          random() +
          random()
        ) / 4;


      const spread =
        (
          spreadRandom - 0.5
        ) *
        Math.min(
          width,
          height
        ) *
        0.52;


      /*
       * Rotate coordinates into galaxy direction.
       */

      const x =
        centerX +
        along * cos -
        spread * sin;

      const y =
        centerY +
        along * sin +
        spread * cos;


      const distanceFromCore =
        Math.abs(spread);


      const maxSpread =
        Math.min(
          width,
          height
        ) * 0.27;


      const density =
        Math.max(
          0,
          1 -
          distanceFromCore /
          maxSpread
        );


      if (
        density <= 0 ||
        random() > density * 1.25
      ) {
        continue;
      }


      const radius =
        randomBetween(
          8,
          45
        );


      const alpha =
        randomBetween(
          0.004,
          0.022
        ) *
        density;


      const colours = [
        `rgba(255,249,244,${alpha})`,
        `rgba(231,195,165,${alpha})`,
        `rgba(201,157,152,${alpha * 0.75})`,
        `rgba(190,205,222,${alpha * 0.65})`
      ];


      context.fillStyle =
        colours[
          Math.floor(
            random() * colours.length
          )
        ];


      context.beginPath();

      context.ellipse(
        x,
        y,
        radius * randomBetween(
          1.4,
          3
        ),
        radius,
        angle,
        0,
        Math.PI * 2
      );

      context.fill();

    }


    /* ============================================================
       GALACTIC CORE
    ============================================================ */

    const coreGradient =
      context.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        Math.min(width, height) * 0.33
      );


    coreGradient.addColorStop(
      0,
      'rgba(255,239,220,.14)'
    );

    coreGradient.addColorStop(
      0.18,
      'rgba(231,195,165,.07)'
    );

    coreGradient.addColorStop(
      0.45,
      'rgba(201,157,152,.035)'
    );

    coreGradient.addColorStop(
      1,
      'rgba(9,13,22,0)'
    );


    context.fillStyle =
      coreGradient;

    context.fillRect(
      0,
      0,
      width,
      height
    );


    /* ============================================================
       DARK DUST LANES
    ============================================================ */

    /*
     * Real Milky Way photography has dark cloud lanes.
     *
     * This prevents the background looking like a glowing
     * airbrush stripe.
     */

    context.globalCompositeOperation =
      'destination-out';


    for (
      let i = 0;
      i < 180;
      i++
    ) {

      const along =
        randomBetween(
          -width * 0.55,
          width * 0.55
        );


      const spread =
        randomBetween(
          -height * 0.055,
          height * 0.055
        );


      const x =
        centerX +
        along * cos -
        spread * sin;

      const y =
        centerY +
        along * sin +
        spread * cos;


      const size =
        randomBetween(
          18,
          85
        );


      context.globalAlpha =
        randomBetween(
          0.025,
          0.08
        );


      context.fillStyle =
        '#000';


      context.beginPath();

      context.ellipse(
        x,
        y,
        size * randomBetween(
          1.5,
          4
        ),
        size,
        angle,
        0,
        Math.PI * 2
      );

      context.fill();

    }


    context.globalCompositeOperation =
      'source-over';

    context.globalAlpha = 1;


    /* ============================================================
       DENSE GALAXY STARS
    ============================================================ */

    for (
      let i = 0;
      i < 1100;
      i++
    ) {

      const along =
        randomBetween(
          -width * 0.72,
          width * 0.72
        );


      const spread =
        (
          (
            random() +
            random() +
            random()
          ) / 3 -
          0.5
        ) *
        height *
        0.30;


      const x =
        centerX +
        along * cos -
        spread * sin;

      const y =
        centerY +
        along * sin +
        spread * cos;


      if (
        x < 0 ||
        x > width ||
        y < 0 ||
        y > height
      ) {
        continue;
      }


      const radius =
        randomBetween(
          0.25,
          1.15
        );


      context.globalAlpha =
        randomBetween(
          0.12,
          0.65
        );


      context.fillStyle =
        random() > 0.82
          ? COLORS.champagne
          : COLORS.ivory;


      context.beginPath();

      context.arc(
        x,
        y,
        radius,
        0,
        Math.PI * 2
      );

      context.fill();

    }


    context.globalAlpha = 1;

  }


  /* ============================================================
     BUILD STATIC LAYERS
  ============================================================ */

  function buildLayers(): void {

    farStars =
      document.createElement('canvas');

    nearStars =
      document.createElement('canvas');

    galaxy =
      document.createElement('canvas');


    const farContext =
      prepareLayer(farStars);

    const nearContext =
      prepareLayer(nearStars);

    const galaxyContext =
      prepareLayer(galaxy);


    /*
     * Thousands of tiny stars.
     */
    createStarField(
      farContext,
      Math.floor(
        width * height / 1800
      ),
      0.15,
      0.8,
      0.42
    );


    /*
     * Small number of slightly closer stars.
     */
    createStarField(
      nearContext,
      Math.floor(
        width * height / 8500
      ),
      0.4,
      1.7,
      0.72
    );


    createMilkyWay(
      galaxyContext
    );

  }


  /* ============================================================
     CANVAS RESIZE
  ============================================================ */

  function resize(): void {

    width =
      window.innerWidth;

    height =
      window.innerHeight;


    dpr =
      Math.min(
        window.devicePixelRatio || 1,
        1.5
      );


    canvas.width =
      width * dpr;

    canvas.height =
      height * dpr;


    canvas.style.width =
      `${width}px`;

    canvas.style.height =
      `${height}px`;


    ctx.setTransform(
      dpr,
      0,
      0,
      dpr,
      0,
      0
    );


    buildLayers();

  }


  /* ============================================================
     CURSOR PARALLAX
  ============================================================ */

  function handlePointerMove(
    event: PointerEvent
  ): void {

    if (!hasPointer) {
      return;
    }


    targetX =
      (
        event.clientX /
        width -
        0.5
      ) * 2;


    targetY =
      (
        event.clientY /
        height -
        0.5
      ) * 2;

  }


  function handlePointerLeave(): void {

    targetX = 0;
    targetY = 0;

  }


  /* ============================================================
     RENDER
  ============================================================ */

  function drawBackground(): void {

    ctx.fillStyle =
      COLORS.background;

    ctx.fillRect(
      0,
      0,
      width,
      height
    );


    /*
     * Deep-blue atmospheric bloom.
     */
    const gradient =
      ctx.createRadialGradient(
        width * 0.65,
        height * 0.15,
        0,
        width * 0.65,
        height * 0.15,
        Math.max(
          width,
          height
        ) * 0.85
      );


    gradient.addColorStop(
      0,
      'rgba(37,52,74,.16)'
    );

    gradient.addColorStop(
      0.45,
      'rgba(17,24,39,.08)'
    );

    gradient.addColorStop(
      1,
      'rgba(9,13,22,0)'
    );


    ctx.fillStyle =
      gradient;

    ctx.fillRect(
      0,
      0,
      width,
      height
    );

  }


  function drawLayer(
    layer: HTMLCanvasElement,
    offsetX: number,
    offsetY: number,
    opacity: number
  ): void {

    ctx.save();

    ctx.globalAlpha =
      opacity;


    /*
     * Draw slightly oversized so cursor movement
     * never exposes an empty edge.
     */
    ctx.drawImage(
      layer,
      offsetX - 18,
      offsetY - 18,
      width + 36,
      height + 36
    );


    ctx.restore();

  }


  function render(
    time = 0
  ): void {


    /*
     * Smooth cursor movement.
     *
     * Gives the scene physical weight instead of tracking
     * the mouse instantly.
     */

    mouseX +=
      (
        targetX -
        mouseX
      ) * 0.035;


    mouseY +=
      (
        targetY -
        mouseY
      ) * 0.035;


    drawBackground();


    /*
     * Extremely slow natural drift.
     */
    const driftX =
      Math.sin(
        time * 0.00004
      ) * 2;

    const driftY =
      Math.cos(
        time * 0.000035
      ) * 1.5;


    /*
     * FAR STARS
     */
    drawLayer(
      farStars,
      mouseX * -2 + driftX,
      mouseY * -2 + driftY,
      0.72
    );


    /*
     * MILKY WAY
     */
    drawLayer(
      galaxy,
      mouseX * -7 + driftX,
      mouseY * -5 + driftY,
      0.88
    );


    /*
     * NEAR STARS
     */
    drawLayer(
      nearStars,
      mouseX * -13,
      mouseY * -9,
      0.82
    );


    /*
     * VIGNETTE
     *
     * Keeps text readable and makes the composition
     * feel cinematic rather than game-like.
     */

    const vignette =
      ctx.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(
          width,
          height
        ) * 0.18,
        width / 2,
        height / 2,
        Math.max(
          width,
          height
        ) * 0.72
      );


    vignette.addColorStop(
      0,
      'rgba(9,13,22,0)'
    );

    vignette.addColorStop(
      0.68,
      'rgba(9,13,22,.10)'
    );

    vignette.addColorStop(
      1,
      'rgba(9,13,22,.58)'
    );


    ctx.fillStyle =
      vignette;

    ctx.fillRect(
      0,
      0,
      width,
      height
    );


    if (!prefersReducedMotion) {

      frameId =
        requestAnimationFrame(
          render
        );

    }

  }


  /* ============================================================
     EVENTS
  ============================================================ */

  function handleResize(): void {

    clearTimeout(
      resizeTimer
    );


    resizeTimer =
      setTimeout(
        () => {

          resize();

          if (prefersReducedMotion) {
            render();
          }

        },
        150
      );

  }


  window.addEventListener(
    'pointermove',
    handlePointerMove,
    {
      passive: true
    }
  );


  document.addEventListener(
    'pointerleave',
    handlePointerLeave
  );


  window.addEventListener(
    'resize',
    handleResize,
    {
      passive: true
    }
  );


  /* ============================================================
     START
  ============================================================ */

  resize();

  render();


  /* ============================================================
     CLEANUP FOR ANGULAR HOT RELOAD
  ============================================================ */

  (window as any).__portfolioGalaxyCleanup =
    () => {

      cancelAnimationFrame(
        frameId
      );

      clearTimeout(
        resizeTimer
      );


      window.removeEventListener(
        'pointermove',
        handlePointerMove
      );


      document.removeEventListener(
        'pointerleave',
        handlePointerLeave
      );


      window.removeEventListener(
        'resize',
        handleResize
      );


      canvas.remove();

    };

})();

