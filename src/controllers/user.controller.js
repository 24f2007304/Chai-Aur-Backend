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


const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if (incomingRefreshToken) {
        throw new ApiError(401, "unauthroized request")
    }


    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }


        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { newaccessToken, newrefreshToken } = await generateAccessAndRefreshTokes(user._id)

        return res
            .status(200)
            .cookie("accessToken", newaccessToken, options)
            .cookie("refreshToken", newrefreshToken, options)
            .json(
                new ApiResponse(200, { newaccessToken, newrefreshToken },
                    "Access token refreshed Successsfully"
                )
            )

    } catch (error) {
        throw new ApiError(400, `Error on Refreshing the Access token + ${error?.message}`)
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old Password")
    }

    user.password = newPassword
    await user.save()



    return res.status(200).json(new ApiResponse(200, {}, "Password Changed Successfully"))

})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(200, req.user, "Current User fetched Successfully")
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        { new: true }
    ).select("-password") // we are not wanting to return the passowrd

    return res.status(200).json(new ApiResponse(200, user, "Account Details Update Succesfully"))

})


const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.files?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")

    }

    // save the return from the data base in the user (without password field)
    const user = await User.findByIdAndUpdate(req.user?._id, // finding the user by Id
        {
            $set: {
                "avatar": avatar.url
            }
        },
        { new: true }

    ).select("-password")

    return res.status(200).json(new ApiResponse(200, user
        , "Avatar Updated Succesfully"
    ))
})

const updateUserConverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.files?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Conver Image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on Cover Image")

    }

    // save the return from the data base in the user (without password field)
    const user = await User.findByIdAndUpdate(req.user?._id, // finding the user by Id
        {
            $set: {
                "avatar": coverImage.url
            }
        },
        { new: true }

    ).select("-password")
    // TODO to delete the image in Cloudinary
    return res.status(200).json(new ApiResponse(200, user
        , "Cover Image Updated Succesfully"
    ))
})


const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params


    if (!username?.trim()) {
        throw new ApiError(400, "UserName is Missing")

    }

    const channel = await User.aggregate([
        {
            $match: {
                userName: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribersTo"
            }
        },
        {
            $addFields:{
                subscriberscount:{
                    $size: "$subscribers"
                },
                channelSubscribedTocount:{
                    $size:"$subscribersTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                fullName:1,
                userName:1,
                subscriberscount:1,
                channelSubscribedTocount:1,
                isSubscribed:1,
                avatar:1,
                email:1,
                coverImage:1
            }
        }
    
    ])
})

export {
    registrationUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateUserAvatar,
    updateAccountDetails,
    getUserChannelProfile

}