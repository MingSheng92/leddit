import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
import microConfig from "./mikro-orm.config";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import redis from "redis";
import session from "express-session";
import connectRedis from "connect-redis";
import cors from 'cors'

const main = async () => {
  // establish database connection with mikro-orm
  const orm = await MikroORM.init(microConfig);
  await orm.getMigrator().up();

  const app = express();

  const RedisStore = connectRedis(session);
  const redisClient = redis.createClient();

  // apply cors rules to express 
  app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
  }))

  app.use(
    session({
      name: "qid",
      store: new RedisStore({
        client: redisClient,
        disableTouch: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 2, // 2 years
        httpOnly: true,
        sameSite: "lax", //csrf seting
        secure: __prod__, // cookie only works in https
      },
      saveUninitialized: false,
      secret: "ascasjpwqndwbcbsaiu",
      resave: false,
    })
  );

  // req res is to for backend to access cookes
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }) => ({ em: orm.em, req, res }),
  });

  // apply middleware with apolloserver
  apolloServer.applyMiddleware({ app, cors: false });

  app.listen(4000, () => {
    console.log("server started on localhost:4000");
  });

  // ADD POST
  // create new post with mikroorm
  //const post = orm.em.create(Post, {title: 'my first post'});
  // add new post into postgresql
  //await orm.em.persistAndFlush(post);

  // GET POST
  //const posts = await orm.em.find(Post, {})
  //console.log(posts)
};

main().catch((err) => {
  console.log("Error : ");
  console.error(err);
});
