import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import {
    GATE_DESCRIPTIONS,
    CHANNEL_DESCRIPTIONS,
    TYPE_DESCRIPTIONS,
    AUTHORITY_DESCRIPTIONS,
    PROFILE_DESCRIPTIONS,
    CENTER_DESCRIPTIONS,
} from "../data/hdContent";
import { BLOG_ARTICLES, BLOG_CATEGORIES } from "../data/blogArticles";
import { BLOG_ARTICLES_EN } from "../data/blogArticlesEn";

/**
 * Content Router
 * Serves static Human Design data and Blog articles asynchronously
 * to reduce the client-side bundle size.
 */
export const contentRouter = router({
    /**
     * Fetch all Human Design static definitions
     */
    getHdContent: publicProcedure.query(() => {
        return {
            gates: GATE_DESCRIPTIONS,
            channels: CHANNEL_DESCRIPTIONS,
            types: TYPE_DESCRIPTIONS,
            authorities: AUTHORITY_DESCRIPTIONS,
            profiles: PROFILE_DESCRIPTIONS,
            centers: CENTER_DESCRIPTIONS,
        };
    }),

    /**
     * Fetch list of blog articles (without full content to save bandwidth)
     */
    blogList: publicProcedure
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

    /**
     * Fetch a single blog article by slug
     */
    blogPost: publicProcedure
        .input(z.object({
            slug: z.string(),
            locale: z.string().optional()
        }))
        .query(({ input }) => {
            const isEn = input?.locale === 'en';
            const articleList = isEn ? BLOG_ARTICLES_EN : BLOG_ARTICLES;
            const article = articleList.find(a => a.slug === input.slug);
            return article || null;
        }),
});
