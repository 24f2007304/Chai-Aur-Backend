import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    subscriber :{
        type:mongoose.Schema.Types.ObjectId, // one who is subscribied
        ref:"User"
    },
    channel:{
        type:mongoose.Schema.Types.ObjectId, // one to whom subscriber is subscribing
        ref:"User"
    }

},{timestamps:true})


export const subscription = mongoose.Model("Subscription",subscriptionSchema)