import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  Compass, Users, Target, Brain, Fingerprint, CircleDot,
  Zap, Eye, Heart, Star, FileText, Clock, ArrowRight,
  BookOpen, Search,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  Compass, Users, Target, Brain, Fingerprint, CircleDot,
  Zap, Eye, Heart, Star, FileText,
};

const CATEGORY_STYLES: Record<string, string> = {
  zaklady: "bg-amber-100 text-amber-800 border-amber-200",
  typy: "bg-violet-100 text-violet-800 border-violet-200",
  strategie: "bg-emerald-100 text-emerald-800 border-emerald-200",
  autorita: "bg-blue-100 text-blue-800 border-blue-200",
  profil: "bg-rose-100 text-rose-800 border-rose-200",
  centra: "bg-orange-100 text-orange-800 border-orange-200",
  vztahy: "bg-pink-100 text-pink-800 border-pink-200",
};

export default function Blog() {
  const { localePath } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);
  const { data, isLoading } = trpc.blog.list.useQuery(
    activeCategory ? { category: activeCategory } : undefined
  );

  useEffect(() => {
    document.title = "Blog o Human Design | Články, průvodci a tipy";
    const metaDesc = document.querySelector('meta[name="description"]');
    const desc = "Čtěte články o Human Design v češtině. Typy, strategie, autorita, profily, centra — vše, co potřebujete vědět o svém designu.";
    if (metaDesc) metaDesc.setAttribute("content", desc);
    else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = desc;
      document.head.appendChild(meta);
    }
  }, []);

  const articles = data?.articles ?? [];
  const categories = data?.categories ?? [];

  // Featured article = first article (longest / most important)
  const featured = useMemo(() => {
    if (!activeCategory && articles.length > 0) return articles[0];
    return null;
  }, [articles, activeCategory]);

  const restArticles = featured ? articles.slice(1) : articles;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-12 bg-gradient-to-b from-primary/5 to-background">
        <div className="container text-center">
          <Badge className="bg-primary/10 text-primary border-primary/20 border mb-4">
            <BookOpen className="w-3.5 h-3.5 mr-1.5" />
            Blog
          </Badge>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            Články o Human Design
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Prozkoumejte svět Human Design skrze naše články v češtině.
            Typy, strategie, autorita, profily a mnohem více.
          </p>
        </div>
      </section>

      {/* Category filters */}
      <section className="py-6 border-b border-border/50">
        <div className="container">
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              variant={!activeCategory ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(undefined)}
              className="rounded-full"
            >
              Vše
            </Button>
            {categories.map(cat => (
              <Button
                key={cat.key}
                variant={activeCategory === cat.key ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(activeCategory === cat.key ? undefined : cat.key)}
                className="rounded-full"
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i} className="border-border/50 animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-32 bg-muted rounded-lg mb-4" />
                    <div className="h-4 bg-muted rounded w-1/4 mb-3" />
                    <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-full mb-1" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-16">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">Žádné články v této kategorii.</p>
            </div>
          ) : (
            <>
              {/* Featured article */}
              {featured && (
                <Link href={`/blog/${featured.slug}`} className="no-underline block mb-10">
                  <Card className="border-border/50 overflow-hidden hover:shadow-lg transition-shadow group">
                    <div className="grid grid-cols-1 md:grid-cols-2">
                      <div className="relative overflow-hidden min-h-[200px]">
                        {featured.coverImage ? (
                          <img
                            src={featured.coverImage}
                            alt={featured.title}
                            className="w-full h-full object-cover absolute inset-0"
                            style={{ minHeight: 200 }}
                          />
                        ) : (
                          <div className={`${featured.coverColor} p-8 md:p-12 flex items-center justify-center h-full`}>
                            {(() => { const Icon = ICON_MAP[featured.coverIcon] || Compass; return <Icon className="w-20 h-20 text-foreground/20" />; })()}
                          </div>
                        )}
                      </div>
                      <CardContent className="p-6 md:p-8 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className={`${CATEGORY_STYLES[featured.category] || ""} border text-xs`}>
                            {featured.categoryLabel}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {featured.readingTime} min čtení
                          </span>
                        </div>
                        <h2 className="font-serif text-2xl md:text-3xl font-bold mb-3 group-hover:text-primary transition-colors">
                          {featured.title}
                        </h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                          {featured.excerpt}
                        </p>
                        <div className="flex items-center gap-2 text-primary font-medium text-sm">
                          Číst článek
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </Link>
              )}

              {/* Article grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {restArticles.map(article => {
                  const Icon = ICON_MAP[article.coverIcon] || Compass;
                  return (
                    <Link key={article.slug} href={`/blog/${article.slug}`} className="no-underline">
                      <Card className="border-border/50 overflow-hidden hover:shadow-lg transition-all group h-full">
                        <div className="relative overflow-hidden h-44">
                          {article.coverImage ? (
                            <img
                              src={article.coverImage}
                              alt={article.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className={`${article.coverColor} p-6 flex items-center justify-center h-full`}>
                              <Icon className="w-14 h-14 text-foreground/15" />
                            </div>
                          )}
                        </div>
                        <CardContent className="p-5">
                          <div className="flex items-center gap-2 mb-2.5">
                            <Badge className={`${CATEGORY_STYLES[article.category] || ""} border text-xs`}>
                              {article.categoryLabel}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {article.readingTime} min
                            </span>
                          </div>
                          <h3 className="font-serif text-lg font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                            {article.title}
                          </h3>
                          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-3">
                            {article.excerpt}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {article.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary/5">
        <div className="container text-center">
          <h2 className="font-serif text-3xl font-bold mb-4">
            Zjistěte svůj Human Design typ
          </h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Vypočítejte si svou energetickou mapu zdarma a získejte personalizovaný AI rozbor.
          </p>
          <Link href={localePath("/calculate")}>
            <Button size="lg" className="bg-primary text-primary-foreground">
              <Compass className="w-5 h-5 mr-2" />
              Vytvořit moji mapu zdarma
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
