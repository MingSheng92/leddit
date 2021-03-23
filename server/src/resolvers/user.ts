import { Resolver, Ctx, Arg, Mutation, InputType, Field, ObjectType } from "type-graphql";
import { MyContext } from "../types";
import { User } from "../entities/User";
import argon2 from 'argon2';

@InputType() 
class UsernamePasswordInput {
    @Field()
    username: string
    @Field()
    password: string
}

@ObjectType()
class FieldError {
    @Field()
    field: string;

    @Field()
    message: string;
}

@ObjectType()
class UserResponse {
    @Field(()=> [FieldError], {nullable: true})
    errors?: FieldError[]

    @Field(()=> User, {nullable: true})
    user?: User
}

@Resolver()
export class UserResolver {
    @Mutation(() => UserResponse)
    async register(
        @Arg('options') options: UsernamePasswordInput,
        @Ctx() {em}: MyContext
    ): Promise<UserResponse> {
        if (options.username.length <= 2) {
            return {
                errors : [{
                    field: 'username',
                    message: 'Username length must be more than 2 characters'
                }]
            }
        }

        if (options.password.length <= 5) {
            return {
                errors : [{
                    field: 'password',
                    message: 'password length must be more than 5 characters'
                }]
            }
        }

        const hashedPass = await argon2.hash(options.password)
        const user = em.create(User, {
            username: options.username, 
            password: hashedPass
        })

        try {
            await em.persistAndFlush(user);
        } catch (error) {
            if (error.code === "23505") {
                return {
                    errors : [{
                        field: 'username',
                        message: 'Username has already been taken!'
                    }]
                }          
            }
            console.log("message: ", error.message);
        }

        return { user };
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg('options') options: UsernamePasswordInput,
        @Ctx() {em}: MyContext
    ): Promise<UserResponse> {
        const user = await em.findOne(User, {username: options.username})
        
        // if fail to find a valid user
        if (!user) {
            return {
                errors : [{
                    field: 'username',
                    message: 'Username does not exist',
                }]
            }
        }

        const valid = await argon2.verify(user.password, options.password)
        if (!valid) {
            return {
                errors : [{
                    field: 'password',
                    message: 'Incorrect password',
                }]
            }            
        }

        return { user };
    }
}