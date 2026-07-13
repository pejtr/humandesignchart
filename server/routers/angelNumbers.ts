import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getAngelNumbersByCategory, getAngelNumberBySlug, angelNumbers } from "../data/angelNumbers";

export const angelNumbersRouter = router({
    list: publicProcedure.query(() => {
        // Return lightweight version for listing (without content string)
        return angelNumbers.map(({ content, faq, ...rest }) => rest);
    }),

    getByCategory: publicProcedure
        .input(z.object({ category: z.string() }))
        .query(({ input }) => {
            const articles = getAngelNumbersByCategory(input.category);
            return articles.map(({ content, faq, ...rest }) => rest);
        }),

    getBySlug: publicProcedure
        .input(z.object({ slug: z.string() }))
        .query(({ input }) => {
            const article = getAngelNumberBySlug(input.slug);
            if (!article) return null;
            return article;
        }),
});
