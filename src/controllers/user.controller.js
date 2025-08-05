import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import {User} from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import cookieParser from 'cookie-parser';
import jwt from "jsonwebtoken";

const generatingAccessAndRefreshToken = async(userId) => {
    try {
       const user = await User.findById(userId);
       console.log("User ::",user)
       const accessToken = user.generateAccessToken()
       const refreshToken=user.generateRefreshToken()
       if(!accessToken){
                throw new ApiError(500,"Something went wrong while generatin access token")

       }
       if(!refreshToken){
                throw new ApiError(500,"Something went wrong while generatin refresh token")

       }

       user.refreshToken=refreshToken;
       await user.save({validateBeforeSave : false})

       
       return {accessToken,refreshToken};
        
    } catch (error) {
        console.error("Token generation error:", error);
        throw new ApiError(500,"Something went wrong while generatin access and refresh token")
    }
}

const registerUser= asyncHandler( async (req,res)=>{
    //get user details from frontend
    //validation not-empty
    //check user alredy exist (by email or username)
    //check user files (avater,cover image) ,
    //upload them to cloudinary (avater)
    //cretae  user object  - create entry in db
    // remove password and refresh token field from response
    // check user cteation response
    //return response if avilable

    const {fullName,email,username,password} =req.body;

    // console.log("email ::", email);
    // console.log("password ::", password);
    // console.log("fullName ::", fullName);

    if([fullName,username,password,email].some((field)=>field?.trim()==="")
    ){
        throw new ApiError(400,"All fields are compulsory")
    }

   const existedUser= await User.findOne({
        $or:[{username},  {email}]
    })

    if(existedUser){
        throw new ApiError(409, "user with username or email already exist")
    }    

    const avatarLocalPath= req.files?.avatar[0]?.path;
    //const coverImageLocalPath= req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath=req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError (400,"Avatar file is required")
    }
    const avatar= await uploadOnCloudinary(avatarLocalPath);
    const coverImage=await uploadOnCloudinary(coverImageLocalPath);
    

    // console.log("req.body ::",req.body);
    // console.log("req.files ::",req.files)
    if(!avatar){
        throw new ApiError (400,"Avatar file is required to upload on server")
    }
    
    const user= await User.create({
        fullName,
        username :username.toLowerCase(),
        email,
        avatar:avatar.url,
        coverImage:coverImage?.url|| "",
        password
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while user registration")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registerd sussessfully")
    )


    
})

const loginUser= asyncHandler(async (req,res) => {
    // req body -> data
    //username or email
    //find the user
    //password check
    //access and refresh token
    //send cookies

    const {email,username,password} = req.body;
    if(!username && !email){
        throw new ApiError(400,"username and email is required")
    }


    const user = await User.findOne({
    $or: [{username},{email}]
    })

    if(!user){
        throw new ApiError(404,"User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"invalid user credentials")
    }
    const {accessToken,refreshToken}=await generatingAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options={
        httpOnly: true,
        secure : true
    }

    return res.status(200)
    .cookie("AccessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(        
        new ApiResponse(
            200,
            {
                user: loggedInUser,accessToken,refreshToken
            },
            "User logged in successfully"
        )
    )

}) 

const logoutUser=asyncHandler(async (req,res) => {
    //clear cookies
    //reset refreshToken

   await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken : undefined
            }
        },
        {
            new : true
        }
    )

    const options={
        httpOnly: true,
        secure : true
    };
    return res.
    status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"logout successfully"))
})


const refreshAccessToken = asyncHandler(async (req,res) =>{
//get access token from cookies

try {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if(!incomingRefreshToken){
        throw new ApiError(401,"unauthorized request")
    }
    
    const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
    
    const user = await User.findById(decodedToken?._id);
    
    if(!user){
        throw new ApiError(401,"invalid refresh token")
    }
    
    if(incomingRefreshToken!== user?.refreshToken){
            throw new ApiError(401,"refresh token is expired or used")
    }
    
    const options={
        httpOnly:true,
        secure:true
    }
    const {accessToken,newrefreshToken} = await generatingAccessAndRefreshToken(user._id)
    
      res.status(200)
      .cookie("accessToken" ,accessToken)
      .cookie("refreshToken" ,newrefreshToken)
      .json(
        new ApiResponse(
            200,
            {accessToken,refreshToken : newrefreshToken},
            "access token refreshed"
        )
      )
} catch (error) {
    throw new ApiError(401,error?.message|| "invalid refresh token")
}

})


export {registerUser,loginUser,logoutUser,refreshAccessToken}