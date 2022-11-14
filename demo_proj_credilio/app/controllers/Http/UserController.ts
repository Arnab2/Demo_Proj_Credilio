import { schema, rules } from "@ioc:Adonis/Core/Validator";
import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";

import User from "../../Models/User";
import Profile from "App/Models/Profile";
import { DateTime } from "luxon";

type RegisterResponseType = {
  message: string;
  data?: {
    email: string;
    password: string;
    id: number;
  };
};

type ProfileResponseType = {
  message: String;
  data?: {
    name: string;
    email?: string;
    userId?: number;
    gender: string;
    dob: DateTime;
  };
};

type LogInLogOutResponseType = {
  message: String;
  token?: string;
};

export default class UserController {
  public async register({
    request,
  }: HttpContextContract): Promise<RegisterResponseType> {
    const newUserSchema = schema.create({
      email: schema.string([rules.email()]),
      password: schema.string([rules.minLength(8), rules.maxLength(16)]),
    });
    try {
      const payload = await request.validate({ schema: newUserSchema });

      const userExist = await User.findBy("email", payload.email);

      if (!userExist) {
        const user = await User.create(payload);

        return { message: "registered successfully", data: user };
      } else
        return {
          message: "User already registered with this email",
        };
    } catch (e) {
      return { message: e.messages };
    }
  }

  public async createProfile({
    auth,
    request,
  }: HttpContextContract): Promise<ProfileResponseType> {
    const userId = auth.user?.id;
    request.updateBody({
      ...request.body(),
      userId: userId,
    });
    try {
      const newProfileSchema = schema.create({
        name: schema.string([rules.minLength(3), rules.maxLength(30)]),
        userId: schema.number(),
        mobile: schema.string([rules.mobile()]),
        gender: schema.string([rules.regex(new RegExp(/MALE|FEMALE/))]),
        dob: schema.date({ format: "yyyy-MM-dd" }),
      });
      const payload = await request.validate({ schema: newProfileSchema });
      const profileExists = await Profile.query()
        .where({ user_id: userId })
        .first();
      if (profileExists)
        return { message: "Profile already exists", data: profileExists };

      const profile = await Profile.create(payload);

      return { message: "Profile created successfully", data: profile };
    } catch (e) {
      return { message: e.messages };
    }
  }

  public async viewProfile({
    auth,
  }: HttpContextContract): Promise<ProfileResponseType> {
    try {
      const userId = auth.user?.id;
      const profile = await Profile.query()
        .where({ user_id: userId })
        .select("name", "userId", "gender", "dob")
        .first();

      if (!profile) return { message: "profile is not created yet." };

      await profile.load("user", (userQuery) => {
        userQuery.select("email");
      });

      let resObj = {
        message: "profile fetched successfully.",
        data: {
          name: profile.name,
          email: profile.user.email,
          gender: profile.gender,
          dob: profile.dob,
        },
      };

      return resObj;
    } catch (e) {
      return { message: e.messages };
    }
  }
  public async updateProfile({
    auth,
    request,
  }: HttpContextContract): Promise<ProfileResponseType> {
    const userId = auth.user?.id;

    const newProfileSchema = schema.create({
      name: schema.string.optional([rules.minLength(3), rules.maxLength(30)]),
      mobile: schema.string.optional([rules.mobile()]),
      gender: schema.string.optional([rules.regex(new RegExp(/male|female/i))]),
      dob: schema.date.optional({ format: "yyyy-MM-dd" }),
    });
    try {
      const payload = await request.validate({ schema: newProfileSchema });

      if (!payload || Object.keys(payload).length === 0)
        throw new Error("require at least one valid field");
      else {
        const profile = await Profile.findBy("user_id", userId);
        if (!profile) throw new Error("Profile not found");

        const updatedProfile = await profile?.merge(payload).save();

        let resObj = {
          message: "profile updated",
          data: {
            name: updatedProfile?.name,
            mobile: updatedProfile?.mobile,
            gender: updatedProfile?.gender,
            dob: updatedProfile?.dob,
          },
        };

        return resObj;
      }
    } catch (e) {
      return { message: e.messages ? e.messages : e.message };
    }
  }

  public async deleteProfile({
    auth,
  }: HttpContextContract): Promise<ProfileResponseType> {
    try {
      const userId = auth.user?.id || "";

      const isProfileDeleted = await Profile.query()
        .where("user_id", userId)
        .delete();
      if (!isProfileDeleted[0]) throw new Error("No profile exists");

      const isUserDeleted = await User.query().where("id", userId).delete();
      if (isUserDeleted[0]) return { message: "user deleted" };
      else return { message: "user not found" };
    } catch (e) {
      return { message: e.messages ? e.messages : e.message };
    }
  }

  public async login({
    auth,
    request,
  }: HttpContextContract): Promise<LogInLogOutResponseType> {
    const newUserSchema = schema.create({
      email: schema.string([rules.email()]),
      password: schema.string(),
    });
    try {
      const payload = await request.validate({ schema: newUserSchema });

      const tokenObj = await auth
        .use("api")
        .attempt(payload.email, payload.password, {
          expiresIn: "60 mins",
        });
      return { message: "logged in successfully", token: tokenObj.token };
    } catch (e) {
      if (e.messages) return { message: e.messages };
      else return { message: "Invalid Credentials" };
    }
  }

  public async logout({
    auth,
  }: HttpContextContract): Promise<LogInLogOutResponseType> {
    try {
      await auth.use("api").revoke();
      return {
        message: "Logged out successfully.",
      };
    } catch (e) {
      return {
        message: e.messages,
      };
    }
  }
}
