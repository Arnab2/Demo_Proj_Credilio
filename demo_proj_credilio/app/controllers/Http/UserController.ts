import { schema, rules } from "@ioc:Adonis/Core/Validator";
import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";

import User from "../../Models/User";
import Profile from "App/Models/Profile";

export default class UserController {
  public async register({ request, response }: HttpContextContract) {
    const newUserSchema = schema.create({
      email: schema.string([rules.email()]),
      password: schema.string([rules.minLength(8), rules.maxLength(16)]),
    });
    try {
      const payload = await request.validate({ schema: newUserSchema });

      const userExist = await User.findBy("email", payload.email);

      if (!userExist) {
        const user = await User.create(payload);

        return { msg: "registered successfully", data: user };
      } else
        response.badRequest({ msg: "User already registered with this email" });
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
    if (profile) return { msg: "Profile already exists in DB", data: profile };

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
      gender: schema.string([rules.regex(new RegExp(/male|female/i))]),
      dob: schema.date(),
    });
    try {
      const payload = await request.validate({ schema: newProfileSchema });
      const profile = await Profile.create(payload);

      return { msg: "Profile created successfully", data: profile };
    } catch (e) {
      response.badRequest(e.messages);
    }
  }

  public async viewProfile({ auth, request, response }: HttpContextContract) {
    try {
      type resType = {
        msg: String;
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
        msg: "profile fetched successfully.",
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
        const a = await Profile.query()
          .where("user_id", userId)
          .update(payload);

        if (a[0]) return { msg: "profile updated" };
        else return { msg: "userId not found" };
      }
    } catch (e) {
      response.badRequest(e.messages ? e.messages : e.message);
    }
  }

  public async deleteProfile({ auth, request, response }: HttpContextContract) {
    try {
      const userId = auth.user?.$original.id;
      const isDeleted = await Profile.query().where("user_id", userId).delete();
      if (isDeleted[0]) return { msg: "profile deleted" };
      else return { msg: "profile doesn't exist" };
    } catch (e) {
      response.badRequest(e.messages ? e.messages : e.message);
    }
  }

  public async login({ auth, request, response }: HttpContextContract) {
    const email = request.input("email");
    const password = request.input("password");

    try {
      const tokenObj = await auth.use("api").attempt(email, password, {
        expiresIn: "60 mins",
      });
      return { msg: "logged in successfully", data: tokenObj.token };
    } catch {
      return response.unauthorized("Invalid credentials");
    }
  }

  public async logout({ auth, request, response }: HttpContextContract) {
    await auth.use("api").revoke();
    return {
      msg: "Logged out successfully.",
      revoked: true,
    };
  }
}
