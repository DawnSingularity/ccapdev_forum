import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const coteriesRouter = createTRPCRouter({
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.coterie.findMany();
  }),
});
