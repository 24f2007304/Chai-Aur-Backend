import dotenv from 'dotenv';
import  connectDB  from "./db/index.js";

// Error :: import  {CONNECTDB} from "./db/index.js because  you export 1 thing --> by name connectDB "

dotenv.config() // to get all the env variable before starting the app

connectDB()

/*
import express from "express";

const app = express()
(async ()=>{
     try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",()=>{
            console.log("ERRR:",error);
            throw error
        })

        app.listen(process.env.PORT,()=>{
            console.log(`App is runnning on the ${process.env.PORT}`);
        })

     }catch(error){
        console.error("ERROR: ",error)
     }

})()
     */