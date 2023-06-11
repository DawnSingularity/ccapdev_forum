import { clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";
import type { User } from "@clerk/nextjs/dist/api";

import { createTRPCRouter, privateProcedure, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { Ratelimit } from "@upstash/ratelimit"; // for deno: see above
import { Redis } from "@upstash/redis";
import { filterUserForClient } from "~/server/helpers/filterUserForClient";
import type { Post } from "@prisma/client";



const addUsersDataToPosts = async (posts: Post[]) =>{
  const users = (
    await clerkClient.users.getUserList({
      userId: posts.map((post) => post.authorId),
      limit: 100,
    })
  ).map(filterUserForClient);

  return posts.map(post =>{
    const author = users.find((user) => user.id === post.authorId);
    if(!author) throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR", 
      message: "Author for post not found",
    });
    return {
      post,
      author:{
        ...author,
        username: author.username,
      },
    };
  });
};

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

export const postsRouter = createTRPCRouter({

  getById: publicProcedure
  .input(z.object({id: z.string()}))
  .query(async({ctx,input}) => {
    const post = await ctx.prisma.post.findUnique({
      where:{id: input.id}
    });

    if(!post) throw new TRPCError({code:"NOT_FOUND"});

    return (await addUsersDataToPosts([post]))[0]
    }),

  getAll: publicProcedure.query( async ({ ctx }) => {
    const posts = await ctx.prisma.post.findMany({
      take: 100,
      orderBy: [{createdAt: "desc"}],
    });
    return addUsersDataToPosts(posts);
  }),


  getPostByUserId: publicProcedure.input(z.object({
    userId: z.string(),
    })).query(({ctx, input})=> ctx.prisma.post.findMany({
      where:{
        authorId: input.userId,
      },
      take: 100,
      orderBy: [{createdAt: "desc"}],
    }).then(addUsersDataToPosts)
  ),

  create: privateProcedure
    .input(
      z.object({
        title: z.string().min(1).max(100),
        content: z.string().min(1).max(255),
      })
  ).mutation(async ({ ctx, input}) =>{

    const authorId= ctx.userId;
    
    const { success } = await ratelimit.limit(authorId);

    if(!success) throw new TRPCError({code: "TOO_MANY_REQUESTS"});
    const post = await ctx.prisma.post.create({
      data: {
        authorId,
        title: input.title,
        content: input.content,
      },
    });
    return post;
  }),
});
