import { clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";

import { createTRPCRouter, privateProcedure, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { Ratelimit } from "@upstash/ratelimit"; // for deno: see above
import { Redis } from "@upstash/redis";
import { filterUserForClient } from "~/server/helpers/filterUserForClient";
import type { Comment } from "@prisma/client";

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
const addUsersDataToComments = async (comments: Comment[]) =>{
  const users = (
    await clerkClient.users.getUserList({
      userId: comments.map((comment) => comment.authorId),
      limit: 100,
    })
  ).map(filterUserForClient);

  return comments.map(comment =>{
    const author = users.find((user) => user.id === comment.authorId);
    if(!author) throw new TRPCError({
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
};

export const commentsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ctx, input})=>{
    const comments = await ctx.prisma.comment.findMany({
    });
    if(!comments) throw new TRPCError({code:"NOT_FOUND"});
    
    return comments;
  }),
  getById: publicProcedure
  .input(z.object({id: z.string()}))
  .query(async({ctx,input}) => {
    const comment = await ctx.prisma.comment.findUnique({
      where:{id: input.id}
    });
    if(!comment) throw new TRPCError({code:"NOT_FOUND"});
    
    return [comment][0];
    }),

    getSingleCommentById: publicProcedure
    .input(z.object({ commentId: z.string() }))
    .query(async ({ ctx, input }) => {
      const comments = await ctx.prisma.comment.findMany({
        where: {
          id: input.commentId,
        },
        take: 100,
        orderBy: [{ createdAt: "desc" }],
      });
      const authorIds = comments.map((comment) => comment.authorId);
      const authors = await clerkClient.users.getUserList({
        userId: authorIds,
        limit: 100,
      });
      const commentsWithAuthors = comments.map((comment) => {
        const author = authors.map(filterUserForClient).find((user) => user.id === comment.authorId);
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

  getCommentByPostId: publicProcedure
    .input(z.object({ postId: z.string() }))
    .query(async ({ ctx, input }) => {
      const comments = await ctx.prisma.comment.findMany({
        where: {
          postId: input.postId,
          parentCommentId: null,
        },
        take: 100,
        orderBy: [{ createdAt: "desc" }],
      });
      const authorIds = comments.map((comment) => comment.authorId);
      const authors = await clerkClient.users.getUserList({
        userId: authorIds,
        limit: 100,
      });
      const commentsWithAuthors = comments.map((comment) => {
        const author = authors.map(filterUserForClient).find((user) => user.id === comment.authorId);
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

    getCommentByParentCommentId: publicProcedure
      .input(z.object({parentCommentId: z.string()}))
      .query(async ({ctx, input}) =>{
      const ParentComment = await ctx.prisma.comment.findMany({
        where: {
          parentCommentId: input.parentCommentId,
        },
        take: 100,
        orderBy: [{ createdAt: "asc" }],
      });
      const authorIds = ParentComment.map((comment) => comment.authorId);
      const authors = await clerkClient.users.getUserList({
        userId: authorIds,
        limit: 100,
      });
      const commentsWithAuthors = ParentComment.map((comment) =>{
      const author = authors.map(filterUserForClient).find((user) => user.id === comment.authorId);
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


    getCommentByUserId: publicProcedure.input(z.object({
      userId: z.string(),
      })).query(({ctx, input})=> ctx.prisma.comment.findMany({
        where:{
          authorId: input.userId,
        },
        take: 100,
        orderBy: [{createdAt: "desc"}],
      }).then(addUsersDataToComments)
    ),


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

  subCommentCreate: privateProcedure
    .input(
      z.object({
        postId: z.string(),
        content: z.string().min(1).max(255),
        authorId: z.string(),
        parentCommentId: z.string(),
      })
    ).mutation(async ({ ctx, input}) =>{
    const authorId= ctx.userId;
    const { success } = await ratelimit.limit(authorId);
    if(!success) throw new TRPCError({code: "TOO_MANY_REQUESTS"});
    const comment = await ctx.prisma.comment.create({
      data: {
        authorId,
        content: input.content,
        postId: input.postId,
        parentCommentId: input.parentCommentId,
      },
    });
    return comment;
  }),


  update: privateProcedure
    .input(
      z.object({
        id: z.string(),
        content: z.string().min(1).max(255),
      })
    ).mutation(async ({ctx, input}) =>{
      const authorId = ctx.userId;
      const { success } = await ratelimit.limit(authorId);

    if(!success) throw new TRPCError({code: "TOO_MANY_REQUESTS"});
    const comment = await ctx.prisma.comment.update({
      where:{
        id: input.id,
      },
      data: { 
        content: input.content,
      },
    });
    return comment;
    }),

  delete: privateProcedure
  .input(
    z.object({
      id: z.string(),
    })
  ).mutation(async({ctx, input}) =>{
    const authorId = ctx.userId;
      const { success } = await ratelimit.limit(authorId);

    if(!success) throw new TRPCError({code: "TOO_MANY_REQUESTS"});
    const comment = await ctx.prisma.comment.delete({
      where:{
        id: input.id,
      },
    });
    return comment;
  }),

});


