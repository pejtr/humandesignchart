import { trpc } from "@/lib/trpc";
import { Link, useParams } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import HDLoader from "@/components/HDLoader";
import PageTransition from "@/components/PageTransition";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NotFound from "./NotFound";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { useLanguage } from "@/contexts/LanguageContext";

// Simple markdown renderer
function renderMarkdown(md: string) {
    return md
        .replace(/^### (.*$)/gim, '<h3 class="text-2xl font-bold mt-8 mb-4">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="text-3xl font-bold mt-10 mb-5">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 class="text-4xl font-bold mt-12 mb-6">$1</h1>')
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/\n\n/gim, '<br/><br/>')
        .replace(/\[(.*?)\]\((.*?)\)/gim, "<a href='$2' class='text-purple-600 font-bold hover:underline'>$1</a>");
}

export default function AndelskaCislaDetail() {
    const { localePath } = useLanguage();
    const params = useParams<{ slug: string }>();
    const slug = params?.slug;
    const { data: article, isLoading } = trpc.angelNumbers.getBySlug.useQuery({ slug: slug! }, {
        enabled: !!slug
    });

    useSEO({
        title: article?.metaTitle || "Andělská čísla | Human Design",
        description: article?.metaDescription || "Významy andělských čísel",
    });

    if (isLoading) return <HDLoader />;
    if (!article) return <NotFound />;

    return (
        <PageTransition>
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <div className="flex-1 container py-8 max-w-4xl mx-auto space-y-8">
                <Link href={localePath("/andelska-cisla")} className="text-muted-foreground hover:text-foreground inline-flex items-center text-sm font-medium transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Zpět na přehled čísel
                </Link>

                <header className="space-y-4 pt-4 border-t border-purple-100">
                    <div className="flex gap-2 mb-6">
                        <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                            {article.categoryLabel}
                        </Badge>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
                        {article.title}
                    </h1>
                    <p className="text-xl text-slate-600 border-l-4 border-purple-400 pl-4 py-1 italic">
                        {article.excerpt}
                    </p>
                </header>

                <article className="prose prose-purple prose-lg max-w-none prose-headings:text-slate-800 prose-a:text-purple-600 hover:prose-a:text-purple-800">
                    <div dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content) }} />
                </article>

                {article.faq && article.faq.length > 0 && (
                    <section className="mt-12 bg-slate-50 p-8 rounded-2xl">
                        <h3 className="text-2xl font-bold mb-6">Často kladené otázky k číslu {article.number}</h3>
                        <div className="space-y-6">
                            {article.faq.map((f, i) => (
                                <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                                    <h4 className="font-semibold text-lg text-slate-800 mb-2">{f.question}</h4>
                                    <p className="text-slate-600 leading-relaxed">{f.answer}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <div className="mt-12 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 md:p-12 text-center text-white shadow-xl">
                    <h2 className="text-2xl md:text-3xl font-bold mb-4">
                        Jak vaše energie souvisí s číslem {article.number}?
                    </h2>
                    <p className="text-purple-100 mb-8 max-w-2xl mx-auto text-lg hover:text-white transition-colors duration-300">
                        Jako <span className="font-semibold text-white bg-white/20 px-2 py-0.5 rounded">{article.hdConnection}</span> máte jedinečnou kapacitu pro manifestaci a růst. Zjistěte, co je vaším darem.
                    </p>
                    <Link href={localePath("/calculate")}>
                        <Button size="lg" variant="secondary" className="text-purple-700 font-bold hover:bg-white/90">
                            Vypočítat mapu zdarma <ChevronRight className="ml-2 w-5 h-5" />
                        </Button>
                    </Link>
                </div>
                </div>
            </div>
            <Footer />
        </PageTransition>
    );
}
