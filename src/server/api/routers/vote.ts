import { clerkClient } from "@clerk/nextjs/server";
import { boolean, z } from "zod";
import type { User } from "@clerk/nextjs/dist/api";

import { createTRPCRouter, privateProcedure, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { Ratelimit } from "@upstash/ratelimit"; // for deno: see above
import { Redis } from "@upstash/redis";
import { filterUserForClient } from "~/server/helpers/filterUserForClient";
import type { Post } from "@prisma/client";
import { Input } from "postcss";

export const voteRouter = createTRPCRouter({

  getAll: publicProcedure
  .query(async ({ctx, input})=>{
    const vote = await ctx.prisma.vote.findMany({
    })
    return vote;
  }),
    findPostVote: publicProcedure
      .input(z.object({postId: z.string()}))
      .query(async ({ctx, input}) =>{
      
      const VotePost = await ctx.prisma.vote.findFirst({
        where: {
          postId: input.postId,
        },
      })
      return VotePost;
  }),
  findCommentPost: privateProcedure
      .input(z.object({commentId: z.string()}))
      .query(async ({ctx, input}) =>{
      const authorId = ctx.userId;
      
      const VotePost = await ctx.prisma.vote.findFirst({
        where: {
          commentId: input.commentId,
          authorId,
        },
      })
      return VotePost;
  }),
});