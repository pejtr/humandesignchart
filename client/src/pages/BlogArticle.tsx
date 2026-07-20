import { useLanguage } from "@/contexts/LanguageContext";
import { useParams, useLocation, Link } from "wouter";
import { useEffect, useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useSEO, OG_IMAGES } from "@/hooks/useSEO";
import {
  ArrowLeft, Clock, Calendar, Compass, ArrowRight, BookOpen, Tag,
  Share2, Link2, Check,
} from "lucide-react";
import HDLoader from "@/components/HDLoader";
import Breadcrumbs from "@/components/Breadcrumbs";
import { ProgressiveImage } from "@/components/ProgressiveImage";

const CATEGORY_STYLES: Record<string, string> = {
  zaklady: "bg-amber-100 text-amber-800 border-amber-200",
  typy: "bg-violet-100 text-violet-800 border-violet-200",
  strategie: "bg-emerald-100 text-emerald-800 border-emerald-200",
  autorita: "bg-blue-100 text-blue-800 border-blue-200",
  profil: "bg-rose-100 text-rose-800 border-rose-200",
  centra: "bg-orange-100 text-orange-800 border-orange-200",
  vztahy: "bg-pink-100 text-pink-800 border-pink-200",
};

function renderMarkdown(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 class="font-serif text-xl font-bold mt-8 mb-3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="font-serif text-2xl font-bold mt-10 mb-4">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Internal links: [text](/path) — open in same tab
    .replace(/\[([^\]]+)\]\((\/[^)]+)\)/g, '<a href="$2" class="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors">$1</a>')
    // External links: [text](https://...) — open in new tab
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors">$1</a>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 mb-1">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 mb-1"><span class="font-semibold text-primary">$1.</span> $2</li>')
    .replace(/((?:<li[^>]*>.*<\/li>\n?)+)/g, '<ul class="list-disc list-outside pl-4 mb-4 space-y-1 text-foreground/90">$1</ul>')
    .replace(/^(?!<[hul]|<li|$)(.+)$/gm, '<p class="mb-4 leading-relaxed text-foreground/85">$1</p>')
    .replace(/<ul[^>]*>\s*<ul/g, '<ul')
    .replace(/<\/ul>\s*<\/ul>/g, '</ul>');
}

// ─── Social Share Buttons Component ──────────────────────────────────────────
function ShareButtons({ article, isEn, locale }: { article: { slug: string; title: string; excerpt: string }; isEn: boolean; locale: string }) {
  const [copied, setCopied] = useState(false);
  const baseUrl = locale === 'en' ? 'https://www.humandesignchart.app' : 'https://www.humandesignmapa.cz';
  const articleUrl = `${baseUrl}/blog/${article.slug}`;
  const shareText = `${article.title} — ${article.excerpt.slice(0, 100)}...`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(articleUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLinks = [
    { name: 'Facebook', color: 'hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`, icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" /></svg> },
    { name: 'X', color: 'hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600', url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(articleUrl)}`, icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg> },
    { name: 'WhatsApp', color: 'hover:bg-green-50 hover:text-green-600 hover:border-green-200', url: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + articleUrl)}`, icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg> },
    { name: 'Telegram', color: 'hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200', url: `https://t.me/share/url?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(shareText)}`, icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.492-1.302.48-.428-.013-1.252-.242-1.865-.44-.751-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg> },
  ];

  return (
    <section className="py-6 border-t border-border/50">
      <div className="container max-w-4xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-border/50 bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Share2 className="w-4 h-4" />
            <span className="font-medium">{isEn ? 'Share this article' : 'Sdílet článek'}</span>
          </div>
          <div className="flex items-center gap-2">
            {shareLinks.map(link => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-9 h-9 rounded-full border border-border/50 flex items-center justify-center text-muted-foreground transition-all duration-200 ${link.color}`}
                title={link.name}
              >
                {link.icon}
              </a>
            ))}
            <button
              onClick={handleCopy}
              className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-200 ${copied
                ? 'bg-green-50 text-green-600 border-green-200'
                : 'border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border'
                }`}
              title={isEn ? 'Copy link' : 'Kopírovat odkaz'}
            >
              {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function BlogArticle() {
  const { localePath, locale } = useLanguage();
  const isEn = locale === 'en';
  const params = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const slug = params.slug || "";

  const { data: article, isLoading } = trpc.content.blogPost.useQuery(
    { slug, locale },
    { enabled: !!slug }
  );

  // Also fetch article list for "related articles" sidebar
  const { data: listData } = trpc.content.blogList.useQuery({ locale });

  const articleSlug = article?.slug || slug;
  const csBase = "https://www.humandesignmapa.cz";
  const enBase = "https://www.humandesignchart.app";
  const articleUrl = `https://${locale === 'cs' ? csBase : enBase}/${locale}/blog/${articleSlug}`;

  useSEO(article ? {
    title: article.metaTitle,
    description: article.metaDescription,
    ogImage: article.coverImage || OG_IMAGES.blog,
    ogType: "article",
    ogUrl: articleUrl,
    locale: locale === 'cs' ? 'cs_CZ' : 'en_US',
    keywords: article.tags?.join(', ') ?? '',
    articlePublishedTime: article.publishedAt,
    articleModifiedTime: article.updatedAt,
    twitterCreator: "@humandesignmapa",
    alternateLocales: [
      { lang: 'cs', url: `${csBase}/cs/blog/${articleSlug}` },
      { lang: 'en', url: `${enBase}/en/blog/${articleSlug}` },
    ],
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: article.title,
        description: article.metaDescription,
        datePublished: article.publishedAt,
        dateModified: article.updatedAt,
        inLanguage: locale === 'cs' ? 'cs-CZ' : 'en-US',
        wordCount: article.content ? article.content.split(/\s+/).length : 0,
        keywords: article.tags?.join(', ') ?? '',
        author: {
          "@type": "Organization",
          name: "Human Design Chart",
          url: locale === 'cs' ? "https://www.humandesignmapa.cz" : "https://www.humandesignchart.app",
        },
        publisher: {
          "@type": "Organization",
          name: locale === 'cs' ? "Human Design Mapa" : "Human Design Chart",
          url: locale === 'cs' ? "https://www.humandesignmapa.cz" : "https://www.humandesignchart.app",
          logo: {
            "@type": "ImageObject",
            url: locale === 'cs' ? "https://www.humandesignmapa.cz/favicon.ico" : "https://www.humandesignchart.app/favicon.ico",
          },
        },
        ...(article.coverImage ? {
          image: {
            "@type": "ImageObject",
            url: article.coverImage,
            width: 800,
            height: 450,
          },
        } : {}),
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": articleUrl,
        },
        url: articleUrl,
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `https://${locale === 'cs' ? 'www.humandesignmapa.cz' : 'www.humandesignchart.app'}/${locale}` },
          { "@type": "ListItem", position: 2, name: locale === 'cs' ? 'Blog' : 'Blog', item: `https://${locale === 'cs' ? 'www.humandesignmapa.cz' : 'www.humandesignchart.app'}/${locale}/blog` },
          { "@type": "ListItem", position: 3, name: article.title, item: articleUrl },
        ],
      },
    ],
  } : {
    title: isEn ? "Blog — Human Design Articles & Guides" : "Blog — Human Design Články & Průvodce",
    description: isEn ? "Read expert articles about Human Design: types, profiles, gates, channels, relationships and more." : "Čtěte odborné články o Human Design: typy, profily, brány, dráhy, vztahy a další.",
    ogType: "website",
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="pt-24 pb-16 flex justify-center">
          <HDLoader />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="container pt-24 pb-16 text-center">
          <h1 className="font-serif text-3xl font-bold mb-4">
            {isEn ? "Article not found" : "Článek nenalezen"}
          </h1>
          <p className="text-muted-foreground mb-6">
            {isEn ? "This article does not exist or has been removed." : "Tento článek neexistuje nebo byl odstraněn."}
          </p>
          <Button onClick={() => navigate(localePath("/blog"))}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {isEn ? "Back to blog" : "Zpět na blog"}
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  // Smart related articles: score by shared tags + same category
  const relatedArticles = (() => {
    const all = (listData?.articles ?? []).filter(a => a.slug !== article.slug);
    const scored = all.map(a => {
      let score = 0;
      if (a.category === article.category) score += 3;
      const sharedTags = (a.tags ?? []).filter(t => (article.tags ?? []).includes(t));
      score += sharedTags.length;
      return { ...a, score };
    });
    return scored.sort((a, b) => b.score - a.score).slice(0, 4);
  })();

  const allArticles = listData?.articles ?? [];
  const currentIdx = allArticles.findIndex(a => a.slug === article.slug);
  const prevArticle = currentIdx > 0 ? allArticles[currentIdx - 1] : null;
  const nextArticle = currentIdx < allArticles.length - 1 ? allArticles[currentIdx + 1] : null;

  const formattedDate = new Date(article.publishedAt).toLocaleDateString(isEn ? "en-US" : "cs-CZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {article.coverImage && (
        <div className="w-full h-64 md:h-80 overflow-hidden mt-16">
          <ProgressiveImage
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full"
            imgClassName="object-cover"
          />
        </div>
      )}

      <section className={`${article.coverImage ? 'pt-8' : 'pt-24'} pb-8 bg-gradient-to-b from-primary/5 to-background`}>
        <div className="container max-w-4xl">
          <Breadcrumbs items={[
            { label: "Blog", href: "/blog" },
            { label: article.categoryLabel, href: `/blog?category=${article.category}` },
            { label: article.title }
          ]} />

          <div className="flex items-center gap-3 mb-4">
            <Badge className={`${CATEGORY_STYLES[article.category] || ""} border`}>
              {article.categoryLabel}
            </Badge>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {article.readingTime} {isEn ? "min read" : "min čtení"}
            </span>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formattedDate}
            </span>
          </div>

          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
            {article.title}
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed">
            {article.excerpt}
          </p>
        </div>
      </section>

      <section className="py-8">
        <div className="container max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10">
            <article
              className="prose-custom"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content) }}
            />

            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-6">
                <Card className="border-border/50">
                  <CardContent className="p-4">
                    <h4 className="font-serif text-sm font-semibold mb-3 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      {isEn ? "Tags" : "Štítky"}
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {article.tags.map(tag => (
                        <span key={tag} className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {relatedArticles.length > 0 && (
                  <Card className="border-border/50 overflow-hidden">
                    <div className="px-4 pt-4 pb-2 border-b border-border/40">
                      <h4 className="font-serif text-sm font-semibold flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-primary" />
                        {isEn ? "Related articles" : "Související články"}
                      </h4>
                    </div>
                    <div className="divide-y divide-border/30">
                      {relatedArticles.map(ra => (
                        <Link key={ra.slug} href={localePath(`/blog/${ra.slug}`)} className="no-underline block group">
                          <div className="flex gap-3 p-3 hover:bg-muted/40 transition-colors">
                            {/* Thumbnail */}
                            <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden bg-muted">
                              {ra.coverImage ? (
                                <ProgressiveImage
                                  src={ra.coverImage}
                                  alt={ra.title}
                                  className="w-full h-full"
                                  imgClassName="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className={`w-full h-full flex items-center justify-center text-2xl ${ra.coverColor ?? 'bg-primary/10'}`}>
                                  <BookOpen className="w-6 h-6 text-primary/40" />
                                </div>
                              )}
                            </div>
                            {/* Text */}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium leading-snug group-hover:text-primary transition-colors line-clamp-3 mb-1">
                                {ra.title}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {ra.readingTime} {isEn ? "min" : "min"}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </Card>
                )}

                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4 text-center">
                    <Compass className="w-8 h-8 text-primary mx-auto mb-2" />
                    <p className="text-sm font-semibold mb-1">
                      {isEn ? "Discover your type" : "Zjistěte svůj typ"}
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      {isEn ? "Calculate your free chart" : "Vypočítejte si mapu zdarma"}
                    </p>
                    <Button size="sm" className="w-full bg-primary text-primary-foreground" asChild>
                      <Link href={localePath("/calculate")}>
                        {isEn ? "Free chart" : "Mapa zdarma"}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ── Mobile Related Articles Strip (hidden on lg+) ─────────────────── */}
      {relatedArticles.length > 0 && (
        <section className="py-8 lg:hidden relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.04) 0%, rgba(42,157,143,0.04) 100%)' }}>
          {/* Top decorative line */}
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.3), rgba(42,157,143,0.3), transparent)' }} />

          <div className="container max-w-4xl">
            <div className="flex items-center justify-between mb-5">
              <h4 className="font-serif text-base font-bold flex items-center gap-2 text-foreground">
                <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-3.5 h-3.5 text-primary" />
                </span>
                {isEn ? "Also read" : "Také si přečtěte"}
              </h4>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                {isEn ? "Swipe" : "Posuňte"} →
              </span>
            </div>

            {/* Scroll container with fade edges */}
            <div className="relative">
              {/* Left fade */}
              <div className="absolute left-0 top-0 bottom-0 w-6 z-10 pointer-events-none" style={{ background: 'linear-gradient(90deg, rgba(250,249,255,0.9), transparent)' }} />
              {/* Right fade */}
              <div className="absolute right-0 top-0 bottom-0 w-6 z-10 pointer-events-none" style={{ background: 'linear-gradient(270deg, rgba(250,249,255,0.9), transparent)' }} />

              <div className="flex gap-3.5 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide -mx-4 px-6">
                {relatedArticles.map(ra => (
                  <Link
                    key={ra.slug}
                    href={localePath(`/blog/${ra.slug}`)}
                    className="no-underline flex-shrink-0 snap-start w-52"
                  >
                    <div className="group rounded-2xl border border-border/40 bg-card overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                      {/* Thumbnail with gradient overlay */}
                      <div className="w-full h-28 overflow-hidden bg-muted flex-shrink-0 relative">
                        {ra.coverImage ? (
                          <ProgressiveImage
                            src={ra.coverImage}
                            alt={ra.title}
                            className="w-full h-full"
                            imgClassName="object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center ${ra.coverColor ?? 'bg-gradient-to-br from-primary/10 to-primary/5'}`}>
                            <BookOpen className="w-7 h-7 text-primary/25" />
                          </div>
                        )}
                        {/* Bottom gradient overlay on image */}
                        <div className="absolute inset-x-0 bottom-0 h-8" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.15))' }} />
                        {/* Category badge on image */}
                        <span className={`absolute top-2 left-2 text-[9px] font-semibold px-2 py-0.5 rounded-full border backdrop-blur-sm ${CATEGORY_STYLES[ra.category] || 'bg-muted text-muted-foreground border-border'}`}>
                          {ra.categoryLabel}
                        </span>
                      </div>
                      {/* Content */}
                      <div className="p-3.5 flex flex-col gap-1.5 flex-1">
                        <p className="text-[13px] font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                          {ra.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 flex-1">
                          {ra.excerpt}
                        </p>
                        <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-border/30">
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {ra.readingTime} min
                          </p>
                          <span className="text-[10px] font-medium text-primary group-hover:translate-x-0.5 transition-transform">
                            {isEn ? "Read" : "Číst"} →
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
                {/* Premium CTA card */}
                <Link
                  href={localePath("/calculate")}
                  className="no-underline flex-shrink-0 snap-start w-52"
                >
                  <div className="group rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col items-center justify-center p-5 text-center gap-3 relative" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(42,157,143,0.08) 50%, rgba(212,175,55,0.08) 100%)', border: '1px solid rgba(139,92,246,0.2)' }}>
                    {/* Decorative ring */}
                    <div className="absolute inset-3 rounded-xl border border-dashed border-primary/15 pointer-events-none" />
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Compass className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-primary leading-snug mb-0.5">
                        {isEn ? "Free Chart" : "Mapa zdarma"}
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {isEn ? "Discover your unique energy blueprint" : "Objevte svou jedinečnou energetickou mapu"}
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold text-primary/80 uppercase tracking-wider">
                      {isEn ? "Start now" : "Začít"} →
                    </span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Series Progress Bar ──────────────────────────────────────────────────── */}
      {(() => {
        // Group articles by category as a "series"
        const seriesArticles = (listData?.articles ?? []).filter(a => a.category === article.category);
        if (seriesArticles.length <= 1) return null;
        const currentSeriesIdx = seriesArticles.findIndex(a => a.slug === article.slug);
        const progress = ((currentSeriesIdx + 1) / seriesArticles.length) * 100;
        return (
          <section className="py-6 border-t border-border/50">
            <div className="container max-w-4xl">
              <div className="rounded-xl border border-border/50 bg-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-serif text-sm font-semibold flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    {isEn ? `Series: ${article.categoryLabel}` : `Série: ${article.categoryLabel}`}
                  </h4>
                  <span className="text-xs text-muted-foreground">
                    {currentSeriesIdx + 1} / {seriesArticles.length}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-muted mb-4 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {/* Series articles list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {seriesArticles.map((sa, idx) => (
                    <Link
                      key={sa.slug}
                      href={localePath(`/blog/${sa.slug}`)}
                      className={`no-underline flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-sm ${sa.slug === article.slug
                        ? 'bg-primary/10 text-primary font-medium'
                        : idx <= currentSeriesIdx
                          ? 'text-foreground/70 hover:bg-muted/50'
                          : 'text-muted-foreground hover:bg-muted/50'
                        }`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${sa.slug === article.slug
                        ? 'bg-primary text-primary-foreground'
                        : idx < currentSeriesIdx
                          ? 'bg-primary/20 text-primary'
                          : 'bg-muted text-muted-foreground'
                        }`}>
                        {idx < currentSeriesIdx ? '✓' : idx + 1}
                      </span>
                      <span className="line-clamp-1 text-xs">{sa.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* ── Social Share Buttons ────────────────────────────────────────────────── */}
      <ShareButtons article={article as any} isEn={isEn} locale={locale} />

      <section className="py-8 border-t border-border/50">
        <div className="container max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prevArticle ? (
              <Link href={localePath(`/blog/${prevArticle.slug}`)} className="no-underline">
                <Card className="border-border/50 hover:shadow-md transition-shadow group h-full">
                  <CardContent className="p-5">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <ArrowLeft className="w-3 h-3" />
                      {isEn ? "Previous article" : "Předchozí článek"}
                    </p>
                    <p className="font-serif font-semibold group-hover:text-primary transition-colors line-clamp-2">
                      {prevArticle.title}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ) : <div />}
            {nextArticle ? (
              <Link href={localePath(`/blog/${nextArticle.slug}`)} className="no-underline">
                <Card className="border-border/50 hover:shadow-md transition-shadow group h-full">
                  <CardContent className="p-5 text-right">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1 justify-end">
                      {isEn ? "Next article" : "Další článek"}
                      <ArrowRight className="w-3 h-3" />
                    </p>
                    <p className="font-serif font-semibold group-hover:text-primary transition-colors line-clamp-2">
                      {nextArticle.title}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ) : <div />}
          </div>
        </div>
      </section>

      <section className="py-16 bg-primary/5">
        <div className="container text-center">
          <h2 className="font-serif text-3xl font-bold mb-4">
            {isEn ? "Discover Your Human Design Type" : "Zjistěte svůj Human Design typ"}
          </h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            {isEn
              ? "Calculate your free energy map and get a personalized AI reading."
              : "Vypočítejte si svou energetickou mapu zdarma a získejte personalizovaný AI rozbor."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="bg-primary text-primary-foreground" asChild>
              <Link href={localePath("/calculate")}>
                <Compass className="w-5 h-5 mr-2" />
                {isEn ? "Create My Free Chart" : "Vytvořit moji mapu zdarma"}
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary/40 text-primary hover:bg-primary/5" asChild>
              <Link href={localePath("/dashboard?tab=subscription")}>
                {isEn ? "Invite a friend → free reading" : "Pozvat příteľe → výklad zdarma"}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
