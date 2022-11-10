import Route from "@ioc:Adonis/Core/Route";

Route.group(() => {
  /* this just a test route */
  Route.get("/", async ({ auth, response }) => {
    // const obj = await auth.use('api').authenticate()
    try {
      console.log(auth.user?.$original);
      return { msg: "hello world" };
    } catch (e) {
      response.badRequest(e.message);
    }
  });
  /* this just a test route */

  Route.post("profile", "UserController.createProfile");
  Route.get("profile", "UserController.viewProfile");
  Route.patch("profile", "UserController.updateProfile");
  Route.delete("profile", "UserController.deleteProfile");
}).middleware("auth");

Route.post("register", "UserController.register");

Route.post("login", "UserController.login");

Route.post("logout", "UserController.logout");
