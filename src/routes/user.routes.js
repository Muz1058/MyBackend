import { Router } from "express";
import { changeCurrentPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
import {upload} from '../middlewares/multer.middleware.js';
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router=Router();

router.route("/register").post( 
    upload.fields([  //middleware injection
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser);

router.route("/login").post(loginUser)

//secured routes

router.route("/logout").post(
    verifyJWT,  //middleware for verification
    logoutUser
)
router.route("/refresh-token").post(
    refreshAccessToken
)
router.route("/change-password").post(
    verifyJWT,
    changeCurrentPassword
)
router.route("/curren-user").get(
    verifyJWT,
    getCurrentUser
)

router.route("/update-account").patch(
    verifyJWT,
    updateAccountDetails
)
router.route("/avatar").patch(
    verifyJWT,
    upload.single("avatar"),
    updateUserAvatar
)
router.route("/cover-image").patch(
    verifyJWT,
    upload.single("coverImage"),
    updateUserCoverImage
)

router.route("/c/:username").get(
    verifyJWT,
    getUserChannelProfile
)

router.route("/history").get(
    verifyJWT,
    getWatchHistory
)



export default  router;