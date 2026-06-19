import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { BLOG_ARTICLES, BLOG_CATEGORIES } from "../data/blogArticles";
import { BLOG_ARTICLES_EN } from "../data/blogArticlesEn";

export const blogRouter = router({
    list: publicProcedure
        .input(z.object({
            category: z.string().optional(),
            locale: z.string().optional(),
        }).optional())
        .query(({ input }) => {
            const isEn = input?.locale === 'en';
            let articles = isEn ? BLOG_ARTICLES_EN : BLOG_ARTICLES;
            if (input?.category) {
                articles = articles.filter(a => a.category === input.category);
            }
            return {
                articles: articles.map(({ content, ...rest }) => rest),
                categories: BLOG_CATEGORIES,
            };
        }),
    getBySlug: publicProcedure
        .input(z.object({ slug: z.string(), locale: z.string().optional() }))
        .query(({ input }) => {
            const isEn = input?.locale === 'en';
            const articleList = isEn ? BLOG_ARTICLES_EN : BLOG_ARTICLES;
            const article = articleList.find(a => a.slug === input.slug);
            return article || null;
        }),
});
