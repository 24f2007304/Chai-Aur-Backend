import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key:process.env.CLOUDINARY_CLOUD_KEY, 
  api_secret: process.env.CLOUDINARY_CLOUD_SECRET
});


const uploadOnCloudinary = async (localFilePath) =>{
    try{
         if(!localFilePath) return null 
         // upload the file on the cloudinary 

         const response  = await cloudinary.uploader.upload(localFilePath, {
            resource_type:"auto"
         })
         // remove local storage after succesful upload
         if(fs.existsSync(localFilePath)){ // check for existance of localfile
          fs.unlinkSync(localFilePath)
         }

         // file has been uploaded successfully
         console.log("file is uploaded on cloudinary",response.url)
         return response
    
        }catch(error){

          if(fs.existsSync(localFilePath)){
            fs.unlinkSync(localFilePath) // remove the  locally saved temporary file as the upload operation got failed
            
          }

        return null ;


    }
}


export default uploadOnCloudinary;