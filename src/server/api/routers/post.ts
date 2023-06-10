import { clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";
import type { User } from "@clerk/nextjs/dist/api";

import { createTRPCRouter, privateProcedure, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";


const filterUserForClient = (user: User) => {
  return {
    id: user.id,
    username: user.username,
  };
}

export const postsRouter = createTRPCRouter({
  getAll: publicProcedure.query( async ({ ctx }) => {
    const posts = await ctx.prisma.post.findMany({
      take: 100,
      orderBy: [{createdAt: "desc"}],
    });
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
  }),


  create: privateProcedure
    .input(
      z.object({
        title: z.string().min(1).max(100),
        content: z.string().min(1).max(255),
      })
  ).mutation(async ({ ctx, input}) =>{

    const authorId= ctx.userId;
    
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
