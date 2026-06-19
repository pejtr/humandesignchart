import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { calculateChart } from "../humandesign";
import {
    createChart, getUserCharts, getChartById, updateChart,
    deleteChart, toggleFavorite,
} from "../db";
import { sendLeadOSEvent } from "../leados";

export const chartRouter = router({
    calculate: publicProcedure
        .input(z.object({
            name: z.string().min(1),
            birthDate: z.string(),
            birthTime: z.string(),
            birthPlace: z.string(),
            latitude: z.number(),
            longitude: z.number(),
            timezoneOffset: z.number(),
            timezone: z.string(),
        }))
        .mutation(async ({ input }) => {
            const chartData = calculateChart(
                input.birthDate,
                input.birthTime,
                input.birthPlace,
                input.latitude,
                input.longitude,
                input.timezoneOffset,
                input.timezone,
            );
            return chartData;
        }),

    save: protectedProcedure
        .input(z.object({
            name: z.string().min(1),
            birthDate: z.string(),
            birthTime: z.string(),
            birthPlace: z.string(),
            latitude: z.string(),
            longitude: z.string(),
            timezone: z.string(),
            category: z.enum(["self", "family", "friend", "client", "celebrity", "other"]).default("other"),
            chartData: z.any(),
        }))
        .mutation(async ({ ctx, input }) => {
            const id = await createChart({
                userId: ctx.user.id,
                name: input.name,
                birthDate: input.birthDate,
                birthTime: input.birthTime,
                birthPlace: input.birthPlace,
                latitude: input.latitude,
                longitude: input.longitude,
                timezone: input.timezone,
                category: input.category,
                chartData: input.chartData,
            });

            sendLeadOSEvent({
                event: "chart_created",
                data: {
                    userId: ctx.user.id,
                    email: ctx.user.email ?? undefined,
                    chartType: "bodygraph",
                    hdType: (input.chartData as any)?.type ?? undefined,
                    score: 65,
                },
            });

            return { id };
        }),

    list: protectedProcedure.query(async ({ ctx }) => {
        return getUserCharts(ctx.user.id);
    }),

    get: protectedProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ ctx, input }) => {
            return getChartById(input.id, ctx.user.id);
        }),

    update: protectedProcedure
        .input(z.object({
            id: z.number(),
            name: z.string().optional(),
            category: z.enum(["self", "family", "friend", "client", "celebrity", "other"]).optional(),
            roleTag: z.enum(["partner", "partnerka", "manzel", "manzelka", "sef", "sefova", "kolega", "pritel", "pritelkyne", "rodic", "dite", "sourozenec", "kamarad", "klient", "mentor", "jine"]).optional().nullable(),
        }))
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;
            await updateChart(id, ctx.user.id, data as any);
            return { success: true };
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ ctx, input }) => {
            await deleteChart(input.id, ctx.user.id);
            return { success: true };
        }),

    toggleFavorite: protectedProcedure
        .input(z.object({ id: z.number(), isFavorite: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
            await toggleFavorite(input.id, ctx.user.id, input.isFavorite);
            return { success: true };
        }),
});
