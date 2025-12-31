import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/User.model.js";
import uploadOnCloudinary from "../utils/coludinary.js";
import ApiResponse  from "../utils/ApiResponse.js";


const registrationUser = asyncHandler(async(req,res) =>{
    // get user details from the frontend
    // validation - not empty 
    // check if user already exists : from eamil and from user also 
    // check for images check for avatar
    // uploaded them to cloudinary 
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation 
    // return response 
     
    const {fullName , email , userName , password} = req.body
    console.log("email" , email)

    if(
        [fullName , email , userName ,password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400 , "All fields are required")
    }

    const existedUser = User.findOne({
        $or:[{email},{userName}] // finding the userName and password
    })

    if(existedUser){
        throw new ApiError(409 , "User with  email or username is already exists")
    }

    const avatarlocalPath = req.files?.avatar[0]?.path;
    const coverImagePath =  req.files?.coverImage[0]?. 
    path;

    if(!avatarlocalPath){
        throw new ApiError(400 , "Avatar file is required")

    }

    const avatar = await uploadOnCloudinary(avatarlocalPath)
    const coverimage = await uploadOnCloudinary(coverImagePath)

    if(!avatar){
        throw new ApiError(400 , "Avater filr is required")
    }
    
    const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage : coverimage?.url || "", //if the image has the url or not if not then enter empty String
        email,
        password,
        userName : userName.toLowerCase()
    })

    const createdUser  =  await User.findById(user._id).select(
        "-password -refreshToken" 
    )

    if(createdUser){
        throw new ApiError(500, "Something went wrong while registering user")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser , "User registered Successfully")
    )



})

export {registrationUser}