import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/User.model.js";
import uploadOnCloudinary from "../utils/coludinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokes = async (userid) => {
    try {

        const user = await User.findById(userid)

        if (!user) {
            throw new ApiError(404, "User Not Found")
        }
        const accessToken = user.gennerateAccessToken()
        const refreshToken = user.gennerateRefreshToken()

        // console.log(accessToken)
        // console.log(refreshToken)

        user.refreshToken = refreshToken
        await User.updateOne(
            { _id: user._id },
            { $set: { refreshToken: refreshToken } }
        )
        return { accessToken, refreshToken }


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generation refresh and access token")
    }

}


const registrationUser = asyncHandler(async (req, res) => {
    // get user details from the frontend
    // validation - not empty 
    // check if user already exists : from eamil and from user also 
    // check for images check for avatar
    // uploaded them to cloudinary 
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation 
    // return response 

    const { fullName, email, userName, password } = req.body
    console.log("email", email)

    if (
        [fullName, email, userName, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ email }, { userName }] // finding the userName and password
    })

    if (existedUser) {
        throw new ApiError(409, "User with  email or username is already exists")
    }

    const avatarlocalPath = req.files?.avatar[0]?.path;
    const coverImagePath = req.files?.coverImage[0]?.path;

    // traditional way to check the coverImage ...


    //make the cover Image optional
    // let coverimage ;
    // if (coverImagePath){
    //       coverimage = await uploadOnCloudinary(coverImagePath)
    // }

    // console.log(avatarlocalPath)
    // console.log(coverImagePath)  //At this point I get all the information


    if (!avatarlocalPath) {
        throw new ApiError(400, "Avatar local file is required")

    }
    const coverimage = await uploadOnCloudinary(coverImagePath)

    const avatar = await uploadOnCloudinary(avatarlocalPath)


    console.log(avatar)
    console.log(coverimage)
    if (!avatar) {
        throw new ApiError(400, "Avater file is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverimage?.url || "", //if the image has the url or not if not then enter empty String
        email,
        password,
        userName: userName.toLowerCase()
    })

    console.log(user)
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )



})


const loginUser = asyncHandler(async (req, res) => {
    // req body
    // check for email or userName is present hai ki nahi
    // find the user
    // password check 
    // access and refresh token to users
    // send cookie
    // response send to cookie


    const { email, userName, password } = req.body

    if (!(userName || !email)) {
        throw new ApiError(400, "UserName or Email is required")
    }
    const user = await User.findOne({ $or: [{ userName }, { email }] })
    console.log(user)

    if (!user) {
        throw new ApiError(404, "User Does Not Exists")
    }

    const isPasswordvalid = await user.isPasswordCorrect(password)

    if (!isPasswordvalid) {
        throw new ApiError(401, "Invalid users credintials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokes(user._id)

    const loggedinUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedinUser, accessToken,
                    refreshToken
                },
                "User logged In Successfully"
            )
        )

})
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
    req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged Out"))
})


const refreshAccessToken  = asyncHandler(async(req,res) =>{
   const incomingRefreshToken =  req.cookie.refreshToken || req.body.refreshToken

   if(incomingRefreshToken){
    throw new ApiError(401 ,"unauthroized request")
   }


   try{
    const decodedToken = jwt.verify(incomingRefreshToken ,process.env.REFRESH_TOKEN_SECRET)

   const user = await User.findById(decodedToken?._id)

   if(!user){
    throw new ApiError(401 ,"Invalid refresh token")
   }


   if( incomingRefreshToken !== user.refreshToken){
    throw new ApiError(401 ,"Refresh token is expired or used")
   }

   const options ={
    httpOnly :true,
    secure:true
   }

   const {newaccessToken , newrefreshToken} = await generateAccessAndRefreshTokes(user._id)
   
   return res
   .status(200)
   .cookie("accessToken" , newaccessToken , options)
   .cookie("refreshToken" , newrefreshToken,options)
   .json(
    new ApiResponse(200 , {newaccessToken , newrefreshToken},
        "Access token refreshed Successsfully"
    )
   )

   }catch(error){
    throw new ApiError(400 , `Error on Refreshing the Access token + ${error?.message}`)
   }
})

export {
    registrationUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}