import { useLanguage } from "@/contexts/LanguageContext";
import { useParams, useLocation, Link } from "wouter";
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft, Clock, Calendar, Compass, ArrowRight, BookOpen, Tag,
} from "lucide-react";
import HDLoader from "@/components/HDLoader";

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

export default function BlogArticle() {
  const { localePath, locale } = useLanguage();
  const isEn = locale === 'en';
  const params = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const slug = params.slug || "";

  const { data: article, isLoading } = trpc.blog.getBySlug.useQuery(
    { slug, locale },
    { enabled: !!slug }
  );

  // Also fetch article list for "related articles" sidebar
  const { data: listData } = trpc.blog.list.useQuery({ locale });

  useEffect(() => {
    if (article) {
      document.title = article.metaTitle;
      let metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute("content", article.metaDescription);
      else {
        metaDesc = document.createElement("meta");
        (metaDesc as HTMLMetaElement).name = "description";
        (metaDesc as HTMLMetaElement).content = article.metaDescription;
        document.head.appendChild(metaDesc);
      }
      let jsonLd = document.querySelector('script[data-blog-jsonld]');
      if (!jsonLd) {
        jsonLd = document.createElement("script");
        jsonLd.setAttribute("type", "application/ld+json");
        jsonLd.setAttribute("data-blog-jsonld", "true");
        document.head.appendChild(jsonLd);
      }
      const articleUrl = `https://humandesignchart.app/${locale}/blog/${article.slug}`;
      const wordCount = article.content ? article.content.split(/\s+/).length : 0;
      const structuredData = [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description: article.metaDescription,
          datePublished: article.publishedAt,
          dateModified: article.updatedAt,
          inLanguage: locale === 'cs' ? 'cs-CZ' : 'en-US',
          wordCount,
          keywords: article.tags?.join(', ') ?? '',
          author: {
            "@type": "Organization",
            name: "Human Design Chart",
            url: "https://humandesignchart.app",
          },
          publisher: {
            "@type": "Organization",
            name: "Human Design Chart",
            url: "https://humandesignchart.app",
            logo: {
              "@type": "ImageObject",
              url: "https://humandesignchart.app/favicon.ico",
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
            { "@type": "ListItem", position: 1, name: "Home", item: `https://humandesignchart.app/${locale}` },
            { "@type": "ListItem", position: 2, name: locale === 'cs' ? 'Blog' : 'Blog', item: `https://humandesignchart.app/${locale}/blog` },
            { "@type": "ListItem", position: 3, name: article.title, item: articleUrl },
          ],
        },
      ];
      jsonLd.textContent = JSON.stringify(structuredData);
    }
    return () => {
      const el = document.querySelector('script[data-blog-jsonld]');
      if (el) el.remove();
    };
  }, [article, locale]);

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

  const relatedArticles = (listData?.articles ?? [])
    .filter(a => a.category === article.category && a.slug !== article.slug)
    .slice(0, 3);

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
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <section className={`${article.coverImage ? 'pt-8' : 'pt-24'} pb-8 bg-gradient-to-b from-primary/5 to-background`}>
        <div className="container max-w-4xl">
          <Button variant="ghost" size="sm" onClick={() => navigate(localePath("/blog"))} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {isEn ? "Back to blog" : "Zpět na blog"}
          </Button>

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
                  <Card className="border-border/50">
                    <CardContent className="p-4">
                      <h4 className="font-serif text-sm font-semibold mb-3 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        {isEn ? "Related articles" : "Související články"}
                      </h4>
                      <div className="space-y-3">
                        {relatedArticles.map(ra => (
                          <Link key={ra.slug} href={localePath(`/blog/${ra.slug}`)} className="no-underline block group">
                            <p className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">
                              {ra.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {ra.readingTime} {isEn ? "min read" : "min čtení"}
                            </p>
                          </Link>
                        ))}
                      </div>
                    </CardContent>
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
                    <Link href={localePath("/calculate")}>
                      <Button size="sm" className="w-full bg-primary text-primary-foreground">
                        {isEn ? "Free chart" : "Mapa zdarma"}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </aside>
          </div>
        </div>
      </section>

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
            <Link href={localePath("/calculate")}>
              <Button size="lg" className="bg-primary text-primary-foreground">
                <Compass className="w-5 h-5 mr-2" />
                {isEn ? "Create My Free Chart" : "Vytvořit moji mapu zdarma"}
              </Button>
            </Link>
            <Link href={localePath("/dashboard?tab=subscription")}>
              <Button size="lg" variant="outline" className="border-primary/40 text-primary hover:bg-primary/5">
                {isEn ? "Invite a friend → free reading" : "Pozvat příteľe → výklad zdarma"}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
