import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js'

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
    

    

})


export {registerUser}