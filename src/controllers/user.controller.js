import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import {User} from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';

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

    const {fullname,email,username,password} =req.body;

    console.log("email ::", email);
    console.log("password ::", password);

    if([fullname,username,password,email].some((field)=>field?.trim()==="")
    ){
        throw new ApiError(400,"All fields are compulsory")
    }

   const existedUser=  User.findOne({
        $or:[{username},  {email}]
    })

    if(existedUser){
        throw new ApiError(409, "user with username or email already exist")
    }

    

    const avatarLocalPath= req.files?.avatar[0]?.path;
    const coverImageLocalPath= req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError (400,"Avatar file is required")
    }

    const avatar= await uploadOnCloudinary(avatarLocalPath);
    if(coverImageLocalPath){
        const coverImage = await uploadOnCloudinary(coverImageLocalPath); 
    }

    if(!avatar){
        throw new ApiError (400,"Avatar file is required to upload on server")
    }
    
    const user= await User.create({
        fullname,
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


    console("req.body ::",req.body);
    console("req.files ::",req.files)
})


export {registerUser}