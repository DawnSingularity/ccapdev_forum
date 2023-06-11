import { clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";
import type { User } from "@clerk/nextjs/dist/api";

import { createTRPCRouter, privateProcedure, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

const filterUserForClient = (user: User) =>{
  return {
    id: user.id,
    username: user.username,
    profileImageUrl: user.profileImageUrl,
  }
}

export const commentsRouter = createTRPCRouter({
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
});
