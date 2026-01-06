import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userScehema  = new mongoose.Schema({
    userName:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim : true,
        index : true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim : true,
        
    },
    fullName:{
        type:String,
        index : true,
        unique:true,
        trim : true,
       
    },
    avatar:{
        type:String, // cloudinary url
        required:true,

        
    },
    coverImage:{
        type:String,
        
    },
    watchhistory:[
        {
        type: mongoose.Schema.Types.ObjectId,
        ref:"Video"
        }
    ],
    password:{
        type:String,
        required:[true,"Password is required"]
    },
    refreshToken:{
        type:String,

    }
} ,{timestamps:true})

userScehema.pre("save",async function (next) {
    if(this.isModified("password")){ // check whether the password filed is changed or not
        this.password = await bcrypt.hash(this.password , 10)
        next()
    }
    
})
userScehema.methods.isPasswordCorrect = async function  (password) {
        return await bcrypt.compare(password , this.password) //Checking Whether the password is correct or not
        
    }
userScehema.methods.gennerateAccessToken = function(){
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username:this.userName,
            fullName:this.fullName 

        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userScehema.methods.gennerateRefreshToken = function(){
    return jwt.sign(
        {
            _id:this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User",userScehema) 