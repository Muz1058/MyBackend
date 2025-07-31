import mongoose from 'mongoose';
import { DB_Name } from '../constants.js';


const connectDB= async ()=>{
    try {

       const connectionInstance= await mongoose.connect(`${process.env.MONGODB_URI}/${DB_Name}`)
        console.log(`\n MongoDB connected !! DB HOST `)

       console.log(`\n MongoDB connected !! DB HOST :${connectionInstance}`)
    } catch (error) {
        console.error("MongoDB connection Failed Error :",error)
        process.exit(1)
    }
}

export default connectDB