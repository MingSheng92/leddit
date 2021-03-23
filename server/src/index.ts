import 'reflect-metadata';
import { MikroORM } from '@mikro-orm/core';
import { __prod__ } from './constants';
import microConfig from './mikro-orm.config';
import express from 'express';
import { ApolloServer } from 'apollo-server-express'
import { buildSchema} from 'type-graphql'
import { HelloResolver } from './resolvers/hello';
import { PostResolver } from './resolvers/post';
import { UserResolver } from './resolvers/user'

const main = async () => {
    // establish database connection with mikro-orm
    const orm = await MikroORM.init(microConfig);
    await orm.getMigrator().up();

    const app = express();

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver, PostResolver, UserResolver],
            validate: false
        }),
        context: () => ({ em: orm.em })
    });

    // apply middleware with apolloserver
    apolloServer.applyMiddleware({app});

    app.listen(4000, () => {
        console.log('server started on localhost:4000')
    })

    // ADD POST
    // create new post with mikroorm
    //const post = orm.em.create(Post, {title: 'my first post'});
    // add new post into postgresql
    //await orm.em.persistAndFlush(post);

    // GET POST 
    //const posts = await orm.em.find(Post, {})
    //console.log(posts)
}
 
main().catch((err) => {
    console.log("Error : ")
    console.error(err);
});