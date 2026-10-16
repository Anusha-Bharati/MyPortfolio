import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { ContentService } from '../../services/contentService.service';
import { RouterLink } from '@angular/router';

interface BlogPost {
  title: string;
  status: string;
  category?: string;
  tags?: string[];
  excerpt?: string;
  markdownUrl?: string;
  visible?: boolean;
  slug?: string;
  publishedAt?: string;
  readTime?: string;
}

interface ResearchNotesData {
  title?: string;
  subtitle?: string;
  items?: BlogPost[];
}

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrl: './blog.component.scss'
})
export class BlogComponent implements OnInit, OnDestroy {
  posts: BlogPost[] = [];
  selectedPost: BlogPost | null = null;

  renderedMarkdown = '';
  currentSlug: string | null = null;

  loadingPost = false;
  contentLoaded = false;
  contentError = '';
  postError = '';

  private readonly contentBaseUrl =
    'https://raw.githubusercontent.com/Anusha-Bharati/AB-portfolio-content/main/';

  private readonly destroy$ = new Subject<void>();
  private markdownSubscription?: Subscription;
  private loadedSlug: string | null = null;

  constructor(
    private readonly contentService: ContentService,
    private readonly http: HttpClient,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const slug = params.get('slug');

        if (slug !== this.currentSlug) {
          this.currentSlug = slug;
          this.loadedSlug = null;

          this.markdownSubscription?.unsubscribe();

          this.selectedPost = null;
          this.renderedMarkdown = '';
          this.postError = '';
          this.loadingPost = false;
        }

        this.syncSelectedPost();
      });

    this.contentService.getContent()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: content => {
          const data = content as unknown as {
            researchNotes?: ResearchNotesData;
          };

          this.posts = (data.researchNotes?.items ?? [])
            .filter(post =>
              post.status?.toLowerCase() === 'published' &&
              post.visible !== false
            )
            .map(post => ({
              ...post,
              slug: post.slug || this.slugify(post.title)
            }));

          this.contentLoaded = true;
          this.syncSelectedPost();
        },
        error: error => {
          console.error('Could not load blog content:', error);
          this.contentError = 'Blog content could not be loaded. Please try again later.';
          this.contentLoaded = true;
        }
      });
  }

  getSlug(post: BlogPost): string {
    return post.slug || this.slugify(post.title);
  }

  get recommendedPosts(): BlogPost[] {
    return this.posts
      .filter(post => this.getSlug(post) !== this.currentSlug)
      .slice(0, 3);
  }

  private syncSelectedPost(): void {
    if (!this.currentSlug) {
      this.selectedPost = null;
      this.loadingPost = false;
      return;
    }

    if (!this.contentLoaded) {
      return;
    }

    const post = this.posts.find(
      item => this.getSlug(item) === this.currentSlug
    );

    this.selectedPost = post ?? null;

    if (!post || this.loadedSlug === this.getSlug(post)) {
      return;
    }

    this.loadPost(post);
  }

  private loadPost(post: BlogPost): void {
    this.markdownSubscription?.unsubscribe();

    const slug = this.getSlug(post);
    this.loadedSlug = slug;
    this.renderedMarkdown = '';
    this.postError = '';

    if (!post.markdownUrl) {
      this.postError = 'The Markdown file for this article has not been configured yet.';
      return;
    }

    const url = this.resolveMarkdownUrl(post.markdownUrl);
    const separator = url.includes('?') ? '&' : '?';

    this.loadingPost = true;

    this.markdownSubscription = this.http
      .get(`${url}${separator}v=${Date.now()}`, {
        responseType: 'text'
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: markdown => {
          if (this.currentSlug !== slug) {
            return;
          }

          this.renderedMarkdown = this.markdownToHtml(markdown);
          this.loadingPost = false;
        },
        error: error => {
          if (this.currentSlug !== slug) {
            return;
          }

          console.error('Could not load blog article:', error);
          this.postError = 'This article could not be loaded. Please try again later.';
          this.loadingPost = false;
        }
      });
  }

  private resolveMarkdownUrl(path: string): string {
    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    return `${this.contentBaseUrl}${path.replace(/^\/+/, '')}`;
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private markdownToHtml(markdown: string): string {
    const source = this.escapeHtml(markdown.replace(/\r\n/g, '\n'));
    const lines = source.split('\n');
    const output: string[] = [];

    let paragraph: string[] = [];
    let listType: 'ul' | 'ol' | null = null;
    let inCodeBlock = false;
    let codeLines: string[] = [];

    const flushParagraph = (): void => {
      if (paragraph.length) {
        output.push(
          `<p>${this.inlineMarkdown(paragraph.join(' '))}</p>`
        );
        paragraph = [];
      }
    };

    const closeList = (): void => {
      if (listType) {
        output.push(`</${listType}>`);
        listType = null;
      }
    };

    for (const line of lines) {
      if (line.trim().startsWith('```')) {
        flushParagraph();
        closeList();

        if (inCodeBlock) {
          output.push(`<pre><code>${codeLines.join('\n')}</code></pre>`);
          codeLines = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }

        continue;
      }

      if (inCodeBlock) {
        codeLines.push(line);
        continue;
      }

      if (!line.trim()) {
        flushParagraph();
        closeList();
        continue;
      }

      const heading = line.match(/^(#{1,6})\s+(.+)$/);

      if (heading) {
        flushParagraph();
        closeList();

        const level = heading[1].length;
        output.push(
          `<h${level}>${this.inlineMarkdown(heading[2])}</h${level}>`
        );
        continue;
      }

      if (/^\s*(---+|\*\*\*+|___+)\s*$/.test(line)) {
        flushParagraph();
        closeList();
        output.push('<hr>');
        continue;
      }

      const listItem = line.match(/^\s*([-*+]|\d+\.)\s+(.+)$/);

      if (listItem) {
        flushParagraph();

        const nextType = /^\d/.test(listItem[1]) ? 'ol' : 'ul';

        if (listType !== nextType) {
          closeList();
          output.push(`<${nextType}>`);
          listType = nextType;
        }

        output.push(`<li>${this.inlineMarkdown(listItem[2])}</li>`);
        continue;
      }

      if (/^&gt;\s?/.test(line)) {
        flushParagraph();
        closeList();

        output.push(
          `<blockquote><p>${this.inlineMarkdown(
            line.replace(/^&gt;\s?/, '')
          )}</p></blockquote>`
        );
        continue;
      }

      closeList();
      paragraph.push(line);
    }

    if (inCodeBlock) {
      output.push(`<pre><code>${codeLines.join('\n')}</code></pre>`);
    }

    flushParagraph();
    closeList();

    return output.join('\n');
  }

  private inlineMarkdown(text: string): string {
    return text
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(
        /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
      )
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  ngOnDestroy(): void {
    this.markdownSubscription?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }
}