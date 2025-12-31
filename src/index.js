import dotenv from 'dotenv';
import  connectDB  from "./db/index.js";
import app from "./app.js"
// Error :: import  {CONNECTDB} from "./db/index.js because  you export 1 thing --> by name connectDB "

dotenv.config() // to get all the env variable before starting the app

connectDB()
.then(()=>{
    // We are going for the error in the app before listen the app
    app.on("error",(error)=>{
        console.log("ERROR:",error);
        throw error
        process.exit(1)
    })
    app.listen(process.env.PORT || 8000 ,()=>{
        console.log(` Server is running at port : ${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log("MONGO db connection failed !!",err);
})



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