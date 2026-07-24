import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import HDLoader from "@/components/HDLoader";
import PageTransition from "@/components/PageTransition";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useSEO } from "@/hooks/useSEO";
import { useLanguage } from "@/contexts/LanguageContext";

const categoryGradients: Record<string, string> = {
    "Průvodce": "from-purple-400 to-indigo-400",
    "Manifestace": "from-violet-400 to-fuchsia-400",
    "Ochrana": "from-blue-400 to-cyan-400",
    "Transformace": "from-amber-400 to-orange-400",
    "Hojnost": "from-emerald-400 to-teal-400",
    "Probuzení": "from-rose-400 to-pink-400",
    "Láska": "from-pink-400 to-red-400",
};

function getGradient(category: string) {
    return categoryGradients[category] || "from-purple-400 to-indigo-400";
}

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
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <div className="flex-1 container py-8 max-w-6xl mx-auto space-y-12">
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
                                    <div className={`h-40 bg-gradient-to-br ${getGradient(article.categoryLabel)} flex items-center justify-center relative overflow-hidden`}>
                                        {(article as any).imageUrl ? (
                                            <img
                                                src={(article as any).imageUrl}
                                                alt={article.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <>
                                                {/* Sacred geometry glowing rings */}
                                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/30 via-transparent to-black/30" />
                                                <div className="absolute w-32 h-32 rounded-full border border-white/20 scale-125 group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
                                                <div className="absolute w-20 h-20 rounded-full border border-white/30 scale-100 group-hover:rotate-45 transition-transform duration-700 pointer-events-none" />
                                                
                                                {/* Glowing Angel Number */}
                                                <span className="text-5xl font-extrabold text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)] select-none font-serif tracking-widest relative z-10 group-hover:scale-110 transition-transform duration-300">
                                                    {article.number}
                                                </span>
                                            </>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity" />
                                        <Sparkles className="absolute top-3 right-3 w-5 h-5 text-white/70 group-hover:text-white group-hover:rotate-12 transition-all" />
                                    </div>
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
                <Footer />
            </div>
        </PageTransition>
    );
}
