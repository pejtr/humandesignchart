import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Star, Shield, Zap, Heart, Moon, Sun } from "lucide-react";
import HDLoader from "@/components/HDLoader";
import PageTransition from "@/components/PageTransition";
import { useSEO } from "@/hooks/useSEO";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AndelskaCisla() {
    const { localePath } = useLanguage();
    const { data: articles, isLoading } = trpc.angelNumbers.list.useQuery();

    useSEO({
        title: "Andělská čísla | Významy od 000 do 9999 | Human Design Mapa",
        description: "Objevte skutečný význam andělských čísel a jak souvisí s vaším Human Designem."
    });

    if (isLoading) return <HDLoader />;

    return (
        <PageTransition>

            <div className="container py-8 max-w-6xl mx-auto space-y-12">
                <div className="text-center space-y-4 max-w-3xl mx-auto">
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                        Duchovní Průvodce
                    </Badge>
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight">Kód Andělských Čísel</h1>
                    <p className="text-xl text-muted-foreground">
                        Zjišťujete všude kolem sebe stejná čísla? 11:11, 222, 444? Přečtěte si, co vám vesmír říká.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {articles?.map((article) => (
                        <Link key={article.slug} href={localePath(`/andelska-cisla/${article.slug}`)}>
                            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col group overflow-hidden border-2 hover:border-purple-200">
                                <div className={`h-4 bg-gradient-to-r from-purple-400 to-indigo-400`} />
                                <CardHeader>
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge variant="outline">{article.categoryLabel}</Badge>
                                        <div className="text-muted-foreground text-sm flex space-x-1 items-center">
                                            <Sparkles className="w-4 h-4" />
                                            <span>{article.readingTime} min</span>
                                        </div>
                                    </div>
                                    <CardTitle className="group-hover:text-purple-700 transition-colors">
                                        {article.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <p className="text-muted-foreground line-clamp-3">
                                        {article.excerpt}
                                    </p>
                                    <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
                                        {article.tags.slice(0, 3).map(tag => (
                                            <span key={tag} className="text-xs bg-secondary px-2 py-1 rounded-full text-secondary-foreground">{tag}</span>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </PageTransition>
    );
}
