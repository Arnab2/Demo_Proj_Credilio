import Route from '@ioc:Adonis/Core/Route'
import {schema,rules} from '@ioc:Adonis/Core/Validator'


Route.post('/register',async ({request,response})=>{
    // let {email,password} = request.body()
    // console.log(email,password);
    const newUserSchema = schema.create({
        email: schema.string([rules.email()]),
        password: schema.string([rules.minLength(8),rules.maxLength(16)])
    })
    try{
    const payload = await request.validate({schema:newUserSchema})
    console.log(payload);
    response.send({msg:"registered"})
    }
    catch(e){
     response.badRequest(e.messages)
    }
})

Route.post('/profile', async ({request,response})=>{
   const {dob} = request.body()
   request.updateBody({...request.body(),dob:new Date(dob)})
  
    const newProfileSchema = schema.create({
        name: schema.string([
            rules.minLength(3),rules.maxLength(30)
        ]),
        mobile: schema.string([rules.mobile()]),
        gender: schema.string([rules.equalTo("MALE")]),
        dob: schema.date()
    })
    try{
        const payload = await request.validate({schema:newProfileSchema})
        console.log(payload);
        response.send({msg:"profile created"})
        }
        catch(e){
         response.badRequest(e.messages)
        }
})