import { clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";
import type { User } from "@clerk/nextjs/dist/api";

import { createTRPCRouter, privateProcedure, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { Ratelimit } from "@upstash/ratelimit"; // for deno: see above
import { Redis } from "@upstash/redis";
import { filterUserForClient } from "~/server/helpers/filterUserForClient";


// Create a new ratelimiter, that allows 3 requests per 1 min
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 m"),
  analytics: true,
  /**
   * Optional prefix for the keys used in redis. This is useful if you want to share a redis
   * instance with other applications and want to avoid key collisions. The default prefix is
   * "@upstash/ratelimit"
   */ 
  prefix: "@upstash/ratelimit",
});

export const commentsRouter = createTRPCRouter({
  getAllNoData: publicProcedure.query( async ({ ctx }) => {
    const comments = await ctx.prisma.comment.findMany({
      take: 100,
    });
    return comments;
  }),
  getAll: publicProcedure.query( async ({ ctx }) => {
    const comments = await ctx.prisma.comment.findMany({
      take: 100,
    });
    const users = (
      await clerkClient.users.getUserList({
        userId: comments.map((comment) => comment.authorId),
        limit: 100,
      })
    ).map(filterUserForClient);
    return comments.map(comment =>{
      const author = users.find((user) => user.id === comment.authorId);
      if(!author || !author.username) throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR", 
        message: "Author for post not found",
      });
      return {
        comment,
        author:{
          ...author,
          username: author.username,
        },
    };
  });
  }),

  getCommentByPostId: publicProcedure
    .input(z.object({ postId: z.string() }))
    .query(async ({ ctx, input }) => {
      const comments = await ctx.prisma.comment.findMany({
        where: {
          postId: input.postId,
        },
        take: 100,
        orderBy: [{ createdAt: "desc" }],
      });

      const authorIds = comments.map((comment) => comment.authorId);
      const authors = await clerkClient.users.getUserList({
        userId: authorIds,
        limit: 100,
      });

      const filteredAuthors = authors.map(filterUserForClient);

      const commentsWithAuthors = comments.map((comment) => {
        const author = filteredAuthors.find((user) => user.id === comment.authorId);
        if (!author) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Author for comment not found",
          });
        }
        return {
          comment,
          author: {
            ...author,
            username: author.username,
          },
        };
      });

      return commentsWithAuthors;
    }),


  create: privateProcedure
    .input(
      z.object({
        postId: z.string(),
        content: z.string().min(1).max(255),
        authorId: z.string(),
      })
  ).mutation(async ({ ctx, input}) =>{

    const authorId= ctx.userId;
    const { success } = await ratelimit.limit(authorId);
    if(!success) throw new TRPCError({code: "TOO_MANY_REQUESTS"});
    const post = await ctx.prisma.comment.create({
      data: {
        authorId,
        content: input.content,
        postId: input.postId,
      },
    });
    return post;
  }),
});
function addUsersDataToPosts(comments: import(".prisma/client").Comment[]): any {
  throw new Error("Function not implemented.");
}

