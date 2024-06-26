import React, { useRef, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {getDownloadURL, getStorage, ref, uploadBytesResumable} from 'firebase/storage';
import {app} from '../firebase';
import { useDispatch } from "react-redux";
import {updateUserStart, updateUserSuccess, updateUserFailure, signOut} from '../redux/user/userSlice';
import {deleteUserStart, deleteUserSuccess, deleteUserFailure} from '../redux/user/userSlice';

export default function Profile() {
  const dispatch = useDispatch();
  const fileRef = useRef(null);
  const [image, setImage] = useState(undefined);
  const [imagePercent, setImagePercent] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [formData, setFormData] = useState({});
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const { currentUser,loading, error } = useSelector((state) => state.user);
  useEffect(() =>{
    if(image){
      handleFileUpload(image);
    }
  },[image]);

  const handleFileUpload = async (image)=>{
    const storage = getStorage(app);
    const fileName = new Date().getTime() + image.name;
    const storageRef = ref(storage, fileName);
    const uploadTask = uploadBytesResumable(storageRef, image);
    
    uploadTask.on(
      'state_changed',
      (snapshot) =>{
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes)*100;
        
        setImagePercent(Math.round(progress));
      },
    (error)=>{
      setImageError(true);
    },
    () =>{
      getDownloadURL(uploadTask.snapshot.ref).then
      ((downloadURL) =>
        setFormData({ ...formData,profilePictures:downloadURL})
      );
    }
  );
  console.log(uploadTask);
  };
  const handleChange = (e) =>{
    setFormData({...formData, [e.target.id]: e.target.value});
    console.log("form",formData);
  };
  const handleSubmit = async(e) =>{
    e.preventDefault();
    try {
      dispatch(updateUserStart());
      //console.log(currentUser);
      const res = await fetch(`/api/user/update/${currentUser._id}` ,{
        method:'POST',
        headers:{
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
     // console.log("profilesub",currentUser._id);
      const data = await res.json();
      console.log("handle",data);
      if(data.success === false){
        dispatch(updateUserFailure(data));
        return;
      }
      dispatch(updateUserSuccess(data));
      setUpdateSuccess(true);
    } catch (error) {
      dispatch(updateUserFailure(data));
    }

  };
  const handleDeleteAccount= async(e) =>{
    try {
      dispatch(deleteUserStart());
      
      const res = await fetch(`/api/user/delete/${currentUser._id}` ,{
        method:'DELETE',
        
      });
     // console.log("profilesub",currentUser._id);
      const data = await res.json();
      // console.log("handle",data);
      if(data.success === false){
        dispatch(deleteUserFailure(data));
        return;
      }
      dispatch(deleteUserSuccess(data));
    } catch (error) {
      dispatch(deleteUserFailure(error));
    }
  };
  const handleSignoutAccount = async() =>{
    try {
      await fetch('/api/auth/signout');
      dispatch(signOut());
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className="p-3 max-w-lg mx-auto">
      <h1
        className="text-3xl font-semibold text-center
      my-7"
      >
        Profile
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="file"
          ref={fileRef}
          hidden
          accept="image/.*"
          onChange={(e) => setImage(e.target.files[0])}
        />
        {/* 
        Firebase storage rules
        allow read;
      allow write: if 
      request.resource.size < 2 *1024*1024 &&
      request.resource.contentType.matches('image/.*') */}
        <img
          src={ formData.profilePictures|| currentUser.profilePictures}
          alt="profile"
          className="h-24 w-24 self-center cursor-pointer
        rounded-full object-cover mt-2"
          onClick={() => fileRef.current.click()}
        />
        <p className="text-sm self-center">
          {imageError ? ( 
          <span className="text-red-700">
            Error in uploading a image(file size whoud be less than 2MB)
          </span> 
          ):imagePercent>0 && imagePercent<100 ?(
            <span className="text-slate-700">
              {`Uploading : ${imagePercent}%`}
              </span>
          ): imagePercent == 100 ?( 
            <span className="text-green-700">
              Image uploaded successfully
            </span>
          ):("")}
        </p>
        <input
          defaultValue={currentUser.username}
          type="text"
          placeholder="Username"
          id="username"
          className="bg-slate-100
         p-3 rounded-lg"
         onChange={handleChange}
        />
        <input
          defaultValue={currentUser.email}
          type="email"
          placeholder="Email"
          id="email"
          className="bg-slate-100
         p-3 rounded-lg"
         onChange={handleChange}
        />
        <input
          type="password"
          placeholder="Password"
          id="password"
          className="bg-slate-100
         p-3 rounded-lg"
         onChange={handleChange}
        />
        <button className="bg-slate-700 text-white p-3 rounded-lg uppercase hover:opacity-90 disabled:opacity-80">
          {loading ? 'Loading...':'Update'}
        </button>
      </form>
      <div className="flex justify-between mt-5">
        <span className="text-red-700 cursor-pointer"
         onClick={handleDeleteAccount}>Delete Account</span>
        <span className="text-red-700 cursor-pointer"
        onClick={handleSignoutAccount}>Sign Out</span>
      </div>
      <p className="text-red-700 mt-5">{error && 'Something went wrong'}</p>
      <p className="text-green-700 mt-5">{updateSuccess && 'User updated successs'}</p>

    </div>
  );
}
