import { Post } from "../entities/Post";
import { Resolver, Query, Ctx, Arg, Int, Mutation } from "type-graphql";
import { MyContext } from "../types"

@Resolver()
export class PostResolver {
    @Query(() => [Post])
    posts( @Ctx() { em } : MyContext ) : Promise<Post[]> {
        return em.find(Post, {});
    }

    @Query(() => Post, {nullable: true})
    post( 
        @Arg('postID', () => Int) id: number,
        @Ctx() { em } : MyContext ) : Promise<Post | null > {
        // equivalent to SELECT * FROM table WHERE id == id
        return em.findOne(Post, { id });
    }

    @Mutation(() => Post)
    async createPost(
        @Arg('title', () => String) title: String,
        @Ctx() { em } : MyContext ) : Promise<Post> {

        const newPost = em.create(Post, {title})
        await em.persistAndFlush(newPost)

        return newPost;
    }

    @Mutation(() => Post, {nullable: true})
    async updatePost(
        @Arg('id', () => Int) id: number,
        @Arg('title', () => String, {nullable: true}) title: String,
        @Ctx() { em } : MyContext ) : Promise<Post | null > {
            const post = await em.findOne(Post, {id})
            
            // if post does not exists
            if (!post) {
                return null;
            }

            if (typeof title !=="undefined") {
                post.title = title
                await em.persistAndFlush(post)
            }
            
            return post;
    }

    @Mutation(() => Boolean)
    async deletePost(
        @Arg('id', () => Int) id: number,
        @Ctx() { em } : MyContext 
    ) : Promise<Boolean> {
        try {
            await em.nativeDelete(Post, {id})
            return true
        } catch {
            return true;
        }
    }
}