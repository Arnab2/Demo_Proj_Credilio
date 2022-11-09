// import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import {schema,rules} from '@ioc:Adonis/Core/Validator'

import User from '../../Models/User'
import Profile from 'App/Models/Profile'
import { DateTime } from 'luxon'


interface ProfileRes{
  name: string,
  email: string,
  gender: string,
  dob: DateTime
}

export default class UserController {
  public async register({request,response}) {
    const newUserSchema = schema.create({
        email: schema.string([rules.email()]),
        password: schema.string([rules.minLength(8),rules.maxLength(16)])
    })
    try{
    const payload = await request.validate({schema:newUserSchema})
    //console.log(payload);
    const userExist = await User.findBy('email',payload.email)
   // console.log(userExist);
    if(!userExist)
    {
    const user = await User.create(payload)
    //console.log(user) 
    response.send({msg:"registered"})
    }
    else
    response.badRequest({msg:"User already registered with this email"})
    }
    catch(e){
     response.badRequest(e.messages)
    }
  }

  public async createProfile({request,response}){
    const {dob} = request.body()
   
    request.updateBody({...request.body(),dob:new Date(dob)})
   
     const newProfileSchema = schema.create({
         name: schema.string([
             rules.minLength(3),rules.maxLength(30)
         ]),
         userId: schema.number(),
         mobile: schema.string([rules.mobile()]),
         gender: schema.string([rules.regex(new RegExp(/male|female/i))]),
         dob: schema.date()
     })
     try{
         const payload = await request.validate({schema:newProfileSchema})
         console.log("**",payload);
         const profile = await Profile.create(payload)
        
         response.send({msg:profile})
         }
         catch(e){
          response.badRequest(e.message)
         }
  }

  public async viewProfile({request,response}){
    const {id} = request.qs()   
    try{
    // const profile = await Profile.findBy('id',id)
    const profile = await Profile.query().where({id}).select('name','userId','gender','dob')
                    .preload('user',(userQuery) => {
                      userQuery.select('email')
                    })
    let newObj  = {
      name: profile[0]?.name,
      email: profile[0].user.email,
      gender: profile[0].gender,
      dob: profile[0].dob,
    } 
    let resObj = newObj as ProfileRes
    console.log(resObj);
    
    response.send({data:resObj})
    }catch(e){
      response.badRequest(e.messages)
    }
  }
  public async updateProfile({request,response}){
    try{
    
      const {dob} = request.body()
      const {userId} = request.qs()
    if(dob)
    request.updateBody({...request.body(),dob:new Date(dob)})
   
     const newProfileSchema = schema.create({
         name: schema.string.optional([
          rules.minLength(3),rules.maxLength(30)
      ]),
         mobile: schema.string.optional([rules.mobile()]),
         gender: schema.string.optional([rules.regex(new RegExp(/male|female/i))]),
         dob: schema.date.optional()
     })
    const payload = await request.validate({schema:newProfileSchema})
    console.log("payload ",payload);

    if(!payload || Object.keys(payload).length===0)
    throw new Error('required at least one valid field')
    else
    {
     const a =  await Profile.query().where('user_id',userId).update(payload)
     console.log("a ",a);
     if(a[0])
     response.send({msg:"profile updated"})
     else
     response.send({msg:"userId not found"})
    }
    }catch(e){
      response.badRequest(e.messages?e.messages:e.message)
    }
  }

  public async deleteProfile({request,response}){
try{
  const {userId} = request.qs()
  const a = await Profile.query().where('user_id',userId ).delete()
  if(a[0])
     response.send({msg:"profile deleted"})
     else
     response.send({msg:"userId not found"})
  
}catch(e){
  response.badRequest(e.messages?e.messages:e.message)
}
  }
}
