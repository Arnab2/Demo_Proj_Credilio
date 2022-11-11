import { schema, rules } from "@ioc:Adonis/Core/Validator";
import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";

import User from "../../Models/User";
import Profile from "App/Models/Profile";

export default class UserController {
  public async register({ request, response }: HttpContextContract) {
    type resType = {
      message: string;
      data: {
        email: string;
        password: string;
        id: number;
      };
    };
    const newUserSchema = schema.create({
      email: schema.string([rules.email()]),
      password: schema.string([rules.minLength(8), rules.maxLength(16)]),
    });
    try {
      const payload = await request.validate({ schema: newUserSchema });

      const userExist = await User.findBy("email", payload.email);

      if (!userExist) {
        const user = await User.create(payload);

        return <resType>{ message: "registered successfully", data: user };
      } else
        response.badRequest({
          message: "User already registered with this email",
        });
    } catch (e) {
      response.badRequest(e.messages);
    }
  }

  public async createProfile({ auth, request, response }: HttpContextContract) {
    const userId = auth.user?.$original.id;

    const profile = await Profile.query()
      .where({ user_id: userId })
      .select("name", "userId", "gender", "dob")
      .first();
    if (profile) return { message: "Profile already exists in DB" };

    const { dob } = request.body();

    if (dob)
      request.updateBody({
        ...request.body(),
        dob: new Date(dob),
        userId: userId,
      });
    else
      request.updateBody({
        ...request.body(),
        userId: userId,
      });

    const newProfileSchema = schema.create({
      name: schema.string([rules.minLength(3), rules.maxLength(30)]),
      userId: schema.number(),
      mobile: schema.string([rules.mobile()]),
      gender: schema.string([rules.regex(new RegExp(/MALE|FEMALE/))]),
      dob: schema.date(),
    });
    try {
      const payload = await request.validate({ schema: newProfileSchema });
      const profile = await Profile.create(payload);

      return { msg: "Profile created successfully" };
    } catch (e) {
      response.badRequest(e.messages);
    }
  }

  public async viewProfile({ auth, request, response }: HttpContextContract) {
    try {
      type resType = {
        message: String;
        data: {
          name: string;
          email: string;
          gender: string;
          dob: string;
        };
      };

      const userId = auth.user?.$original.id;
      const profile = await Profile.query()
        .where({ user_id: userId })
        .select("name", "userId", "gender", "dob")
        .first();

      if (!profile)
        return { msg: "profile is not created yet.", data: profile };

      await profile.load("user", (userQuery) => {
        userQuery.select("email");
      });

      let resObj = <resType>{
        message: "profile fetched successfully.",
        data: {
          name: profile.name,
          email: profile.user.email,
          gender: profile.gender,
          dob: profile.dob.toString(),
        },
      };

      return resObj;
    } catch (e) {
      response.badRequest(e.message);
    }
  }
  public async updateProfile({ auth, request, response }: HttpContextContract) {
    try {
      type resType = {
        message: String;
        data: {
          name: string;
          mobile: string;
          gender: string;
          dob: string;
        };
      };
      const userId = auth.user?.$original.id;
      const { dob } = request.body();

      if (dob) request.updateBody({ ...request.body(), dob: new Date(dob) });

      const newProfileSchema = schema.create({
        name: schema.string.optional([rules.minLength(3), rules.maxLength(30)]),
        mobile: schema.string.optional([rules.mobile()]),
        gender: schema.string.optional([
          rules.regex(new RegExp(/male|female/i)),
        ]),
        dob: schema.date.optional(),
      });
      const payload = await request.validate({ schema: newProfileSchema });

      if (!payload || Object.keys(payload).length === 0)
        throw new Error("require at least one valid field");
      else {
        const profile = await Profile.findBy("user_id", userId);
        if (!profile) throw new Error("userId not found");

        const updatedProfile = await profile?.merge(payload).save();

        let resObj = <resType>{
          message: "profile updated",
          data: {
            name: updatedProfile?.name,
            mobile: updatedProfile?.mobile,
            gender: updatedProfile?.gender,
            dob: updatedProfile?.dob.toString(),
          },
        };

        return resObj;
      }
    } catch (e) {
      response.badRequest(e.messages ? e.messages : e.message);
    }
  }

  public async deleteProfile({ auth, request, response }: HttpContextContract) {
    try {
      const userId = auth.user?.$original.id;

      const isProfileDeleted = await Profile.query()
        .where("user_id", userId)
        .delete();
      if (!isProfileDeleted[0]) throw new Error("No profile exists");

      const isUserDeleted = await User.query().where("id", userId).delete();
      if (isUserDeleted[0]) return { message: "user deleted" };
    } catch (e) {
      response.badRequest(e.messages ? e.messages : e.message);
    }
  }

  public async login({ auth, request, response }: HttpContextContract) {
    const email = request.input("email");
    const password = request.input("password");
    const newUserSchema = schema.create({
      email: schema.string([rules.email()]),
      password: schema.string(),
    });
    try {
      const payload = await request.validate({ schema: newUserSchema });
      console.log(payload);

      const tokenObj = await auth.use("api").attempt(email, password, {
        expiresIn: "60 mins",
      });
      return { message: "logged in successfully", token: tokenObj.token };
    } catch (e) {
      if (e.messages) response.badRequest(e.messages);
      else response.unauthorized("Invalid Credentials");
    }
  }

  public async logout({ auth, request, response }: HttpContextContract) {
    await auth.use("api").revoke();
    return {
      message: "Logged out successfully.",
      revoked: true,
    };
  }
}
